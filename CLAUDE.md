# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Todo o repositório é em pt-BR: identificadores, nomes de arquivo, comentários,
mensagens de erro e colunas do banco (`habitos`, `usuario_id`, `criado_em`).
Código novo segue o mesmo padrão — nada de `getHabits()` ao lado de
`listarHabitos()`.

## Comandos

```bash
npm install                 # uma vez, na raiz (npm workspaces)

npm run mobile              # Expo dev server
npm run desktop             # electron-vite dev (HMR no renderer)
npm run desktop:build       # bundles em apps/desktop/out
npm run typecheck           # todos os workspaces
npm run check:db            # sanidade do backend com a chave pública; sai 1 se falhar

npm run typecheck --workspace @planner-fofo/mobile    # cobre também o shared
npm run typecheck --workspace @planner-fofo/desktop   # roda tsconfig.web + tsconfig.node

npm run db:push             # aplica migrações no projeto linkado
npm run db:types            # regenera packages/shared/src/database.types.ts
```

Não há suíte de testes automatizados, e **o teste do app é manual, feito pela
usuária**. A validação é: `check:db` → `typecheck` → build/bundle → app rodando.
As skills `/testar-mobile` e `/testar-desktop` (em `.claude/skills/`) só sobem o
app (emulador Android e janela do Electron) e devolvem o controle — não navegue
pelas telas nem exercite fluxos por conta própria.

`npm run desktop` e `expo run:android` prendem o terminal: rode em background.

## Distribuicao do desktop

O app instalado se atualiza sozinho pelas releases de `Lintzz/planner-fofo`:
`src/main/atualizador.ts` usa `electron-updater` para ler o `latest.yml` da
release mais recente, baixar em segundo plano e oferecer o reinicio. So roda com
`app.isPackaged` — em dev fica desligado de proposito.

```bash
npm run desktop:package                        # instalador local, sem publicar
npm run versao 1.1.0                           # sobe a versao nos 4 arquivos
GH_TOKEN=$(gh auth token) npm run desktop:release   # build + release no GitHub
```

Regras que ja custaram tempo:

- A versao do `electron` em `apps/desktop/package.json` fica **presa** (sem `^`).
  O electron-builder roda em `apps/desktop`, mas o `electron` esta hoisted no
  `node_modules` da raiz; com faixa de versao ele falha com "Cannot compute
  electron version".
- O `artifactName` nao pode ter espaco: o GitHub troca espaco por ponto no nome
  do asset e o `latest.yml` deixa de casar com a URL de download.
- O NSIS e `perMachine: false` para a atualizacao se instalar sem UAC.
- Uma release so serve para atualizar se tiver os tres arquivos: o `.exe`, o
  `.blockmap` e o `latest.yml`.
- A versao mora em quatro arquivos; use `npm run versao <x.y.z>` em vez de
  editar na mao, senao o instalador e o APK saem com numeros diferentes dentro
  da mesma release. Sem argumento, o script so confere se estao alinhados.
- O `versionCode` do Android e derivado da versao em `app.config.js`
  (1.0.0 -> 10000). O template do Expo deixa fixo em 1, e ai o Android trata
  toda versao nova como se fosse a mesma.

## Arquitetura

Monorepo npm workspaces com dois apps e um núcleo compartilhado:

- `packages/shared` — **toda a lógica**: ambiente, cliente Supabase, design
  tokens, tipos, regras puras (`lib/regras.ts`, `lib/datas.ts`), camada de dados
  (`api/`) e o estado (`react/usePlanner.ts`). Não importa React Native nem DOM.
- `apps/mobile` — React Native + Expo SDK 54, só UI.
- `apps/desktop` — Electron + React + Vite (electron-vite), só UI.

**Regra estrutural:** comportamento novo entra no `shared`; os apps só desenham.
`usePlanner` expõe o mesmo estado e as mesmas ações para os dois, então uma
mudança de regra feita só num app é bug — os números vão divergir.

O `shared` **nunca é compilado**: `main`/`types` apontam para `src/index.ts` e
cada app transpila o TypeScript junto (alias no `electron.vite.config.ts`,
`watchFolders` no `metro.config.js`, `paths` + `include` nos tsconfigs). O pacote
só tem `typecheck` — não crie um `build` nem um script que o chame.

### Ambiente: o ponto que mais quebra

Existe **um `.env` só, na raiz**, fora dos dois apps — nenhum deles o encontra
pelo caminho padrão:

- `packages/shared/src/env.ts` lê apenas `process.env` (o Metro não parseia
  `import.meta`). Quem usa `import.meta.env` injeta via `definirAmbiente()`.
- Desktop: `envDir` no `electron.vite.config.ts` aponta para a raiz; o renderer
  passa `import.meta.env.VITE_*` para `definirAmbiente()`.
- Mobile: `apps/mobile/app.config.js` lê o `.env` da raiz na hora em que a CLI
  monta a config e repassa por `extra`; `src/lib/supabase.ts` injeta a partir de
  `expo-constants`.

Mexeu no `.env` → reinicie o processo. Conferir sem abrir o app:
`cd apps/mobile && npx expo config --type public --json` (o bloco `extra` tem que
vir preenchido).

O cliente mobile é criado **sob demanda**, nunca no topo do módulo: sem ambiente,
`obterCliente()` lança durante o `import` e vira red box em vez da tela "Falta
configurar o Supabase".

### Banco

O backend é a fonte da verdade das estatísticas: `resumo_periodo`, `pct_do_dia`,
`streak_atual`, `consistencia` e `resumo_conquistas` são funções SQL chamadas por
RPC em `shared/src/api/estatisticas.ts`. Regra de negócio que aparece em gráfico
tem que existir nos dois lados idênticos (ex.: dia sem hábitos previstos vale
100% tanto em `resumo_periodo` quanto em `porcentagemDoDia`) — o README lista
essas decisões e o porquê de cada uma.

Migrações em `supabase/migrations/` usam o mesmo `version` do histórico remoto do
projeto `fieqaqyzanxvvuurngbj`. Toda tabela tem RLS; `usuario_id` é denormalizado
em `habito_registros` e `itens` com gatilhos garantindo a consistência. Escrita
que erra o `usuario_id` falha com `new row violates row-level security policy`.
O MCP `supabase` está configurado em `.mcp.json` (`apply_migration`,
`execute_sql`, `query_logs`).

⚠️ **Nunca crie usuária com `INSERT` em `auth.users`.** As colunas de token
(`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`)
aceitam `NULL`, mas o GoTrue as lê como `string` não-nula em Go: uma linha com
`NULL` ali quebra o signup do projeto inteiro — todo cadastro passa a devolver
`500` e a tela mostra `Database error finding user`. Crie conta pela tela de
cadastro do app, pelo dashboard (Authentication → Add user) ou pela Admin API;
esses caminhos preenchem com `''`. **Apagar** por SQL é seguro.

Se o erro já apareceu, ache e apague as linhas quebradas (o cascade leva perfil,
hábitos, registros e tags):

```sql
select id, email from auth.users where confirmation_token is null;
```

Para ver o erro cru: MCP `query_logs` na fonte `auth_logs` filtrando
`log_attributes['path'] = '/signup'`. Voltou ao normal quando um login com
e-mail inexistente devolve `400 invalid_credentials` em vez de `500`.

A confirmação de e-mail vem **ligada** no projeto hospedado, então o cadastro
cria a conta mas não devolve sessão e o app volta para o login. Solução de uma
vez só (não dá por SQL nem pelo MCP — a config é do ambiente do GoTrue):
Dashboard → **Authentication** → **Sign In / Providers** → **Email** → desligar
**Confirm email**. Enquanto isso, confirmar na mão é seguro (é `UPDATE` em linha
existente): `update auth.users set email_confirmed_at = now() where
email_confirmed_at is null;`

### Diferenças de plataforma que são intencionais

- Anel de progresso: `conic-gradient` no desktop, círculo `react-native-svg` com
  `strokeDasharray` no mobile.
- Seletor de data: `<input type="date">` no desktop; três atalhos + setas de dia
  no mobile.
- Mobile usa `useSafeAreaInsets()` de `react-native-safe-area-context`, nunca
  `SafeAreaView` do `react-native` (no Android é uma `View` comum e o conteúdo
  passa por baixo das barras do sistema).
- `apps/mobile/src/tema.ts` reexporta os tokens do `shared` e acrescenta só o que
  é do RN (nomes de fonte do `expo-font`, sombras traduzidas de `box-shadow`).

## APK do Android

O APK sai do **Gradle local**, em duas etapas, a partir de `apps/mobile`:

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew.bat assembleRelease     # ./gradlew fora do Windows
```

Sai em `android/app/build/outputs/apk/release/app-release.apk`. A skill
`/publicar-apk` cobre o resto (versao, commit, conferencia e release).

`eas build --local` **nao roda no Windows** — morre com "Unsupported platform,
macOS or Linux is required to build apps for Android". O `eas.json` e o
`credentials.json` (fora do git) sobraram para um build na nuvem
(`eas build --platform android`, sem `--local`), que e o unico modo do EAS que
funciona daqui e que nunca foi usado neste projeto.

A assinatura vem de `apps/mobile/plugins/assinatura-android.js`, um config
plugin que troca a chave de debug do template pela de verdade durante o
`prebuild`. As credenciais moram em `~/.gradle/gradle.properties`
(`PLANNER_FOFO_KEYSTORE` e as tres senhas), nunca no repositorio. **Sem essas
propriedades o build nao falha:** volta para a chave de debug de proposito, para
quem clonou conseguir compilar. Um APK assim nao instala por cima do anterior,
entao confira o fingerprint antes de publicar — `apksigner verify --print-certs`
tem que dar `a8d3775d...`, o mesmo desde o 1.0.0.

`apps/mobile/android/` e gitignorada e o `--clean` a regenera do zero; sem ele o
build pode aproveitar um `app/build.gradle` de um estado antigo.

**O mobile nao tem atualizacao automatica, de proposito.** Nao existe
`expo-updates` nas dependencias, nem bloco `updates`/`runtimeVersion` na config,
e o `AndroidManifest` sai com `expo.modules.updates.ENABLED=false`. Atualizar =
gerar um APK novo e instalar por cima. Nao instale `expo-updates` "so para
testar": ele liga OTA e passa a exigir `runtimeVersion` coerente entre builds.
A atualizacao automatica existe **so no desktop** (`electron-updater`, ver
"Distribuicao do desktop").

Uma coisa que ja custou um build quebrado, e que precisa das **duas** metades
que estao no `metro.config.js` — mexer em so uma quebra o outro modo:

- **`unstable_serverRoot`** conserta o *release*. O `expo/metro-config` sobe o
  serverRoot para a raiz do monorepo; o plugin Gradle passa
  `export:embed --entry-file index.js` **relativo**, com working directory em
  `apps/mobile`. Sem fixar o serverRoot no proprio app, o bundle de release
  falha com `None of these files exist: ..\..\index.js`.
- **`EXPO_NO_METRO_WORKSPACE_ROOT=1`** conserta o *debug*, e por isso o arquivo
  seta essa variavel antes de carregar o `expo/metro-config`. O Expo CLI nao le
  o `unstable_serverRoot`: ele decide a raiz sozinho em `getMetroServerRoot()`
  (`@expo/config/build/paths/paths.js`), que so olha essa variavel. Com so o
  pin, o manifesto do dev server anuncia `apps/mobile/index.bundle` enquanto o
  Metro serve com raiz em `apps/mobile`, e o dev-client abre na tela de erro com
  `Unable to resolve module ./apps/mobile/index` (ele procura
  `apps/mobile/apps/mobile/index`).

A variavel nao substitui o pin: no `export:embed` ela chega tarde demais, porque
o entry ja foi resolvido quando o `metro.config.js` carrega.

### Bugs que SO aparecem no build de release

O debug pega o bundle do dev server e tem os fallbacks de desenvolvimento
ligados, entao esconde uma classe inteira de erro. **Rodar bem em debug nao diz
nada sobre o release** — teste o APK no emulador antes de publicar. Os tres que
ja apareceram, todos com o app morrendo no primeiro render:

1. **`ActivityIndicator`** → `View config getter callback for component
   `AndroidProgressBar` must be a function`. No Android ele renderiza o
   `AndroidProgressBar`, que e `specs_DEPRECATED` e a New Architecture nao
   registra. Trocado por `src/componentes/Rodinha.tsx` (uma borda girando, sem
   componente nativo). **Nao volte a usar `ActivityIndicator` aqui.**

2. **Polyfill de `URL`** → `Cannot assign to property 'protocol' which has only
   a getter`, vindo do `supabase-js`. O RN reinstala o proprio `URL` **durante o
   `runApplication`** (`polyfillGlobal` <- `setUpDefaltReactNativeEnvironment`),
   depois de todo modulo de entry ter rodado, e como getter preguicoso. Por isso
   `import 'react-native-url-polyfill/auto'` no topo de qualquer modulo — o
   `index.js` inclusive — perde a corrida. A chamada mora dentro de
   `obterSupabase()`, em `src/lib/supabase.ts`, para ser a ultima a escrever.

3. **React Native duplicado** → `View config getter callback for component
   `RCTText` must be a function`. A raiz declarava `expo`/`react`/`react-native`
   (resto de um `expo run:android` rodado na raiz) numa versao diferente da de
   `apps/mobile`, entao o npm nao deduplicava: o codigo do app resolvia uma
   copia e os pacotes `expo-*` a outra, com registros de view config separados.
   **So pode existir um `react-native` no monorepo** — confira com
   `npm ls react-native` antes de investigar qualquer erro de view config.

## Armadilhas

- Comandos do Expo rodam em `apps/mobile`. Rodar `expo run:android` na raiz gera
  um projeto nativo em `android/` (e um `app.json`) na raiz — lixo que o
  `.gitignore` já cobre, mas que não deveria existir.
- Só mude JS/TS? Fast Refresh basta. Refaça o build nativo apenas ao mexer em
  `app.json`, dependências nativas ou Gradle.
- Erros de rede/RLS do `usePlanner` saem em `console.warn` com o prefixo
  `[Planner Fofo]` (logcat no mobile, DevTools no desktop).
- Janela do desktop em branco é quase sempre erro de JS no renderer; fontes ou
  Supabase falhando costuma ser a CSP do `src/renderer/index.html`.
