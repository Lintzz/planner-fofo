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

Não há suíte de testes. A validação é: `check:db` → `typecheck` → build/bundle →
app rodando. As skills `/testar-mobile` e `/testar-desktop` (em `.claude/skills/`)
descrevem esse caminho em detalhe, incluindo os fluxos a exercitar em cada aba,
os erros comuns e o procedimento de cadastro no Supabase hospedado — **leia a
skill correspondente antes de rodar qualquer app**.

`npm run desktop` e `expo run:android` prendem o terminal: rode em background.

## Distribuicao do desktop

O app instalado se atualiza sozinho pelas releases de `Lintzz/planner-fofo`:
`src/main/atualizador.ts` usa `electron-updater` para ler o `latest.yml` da
release mais recente, baixar em segundo plano e oferecer o reinicio. So roda com
`app.isPackaged` — em dev fica desligado de proposito.

```bash
npm run desktop:package                        # instalador local, sem publicar
npm version 1.1.0 --workspace @planner-fofo/desktop --no-git-tag-version
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
`watchFolders` no `metro.config.js`, `paths` + `include` nos tsconfigs). O script
`shared:build` da raiz é vestigial — não existe `build` no pacote.

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

⚠️ **Nunca crie usuária com `INSERT` em `auth.users`** — colunas de token com
`NULL` quebram o signup do projeto inteiro (`500`, `Database error finding user`).
Detalhes e recuperação nas skills de teste. Apagar por SQL é seguro.

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

`npm run mobile:apk` roda o Gradle local (`apps/mobile/android`) — nao usa EAS
nem exige conta no Expo. Duas coisas que ja custaram um build quebrado:

- **Assinatura.** O template do React Native assina o release com a chave de
  *debug*. A troca mora no config plugin
  `apps/mobile/plugins/assinatura-android.js`, porque `android/` e regenerada
  pelo `expo prebuild` e qualquer edicao direta no `build.gradle` some. As
  credenciais ficam em `~/.gradle/gradle.properties`, fora do repositorio.
- **`unstable_serverRoot` no `metro.config.js`.** O `expo/metro-config` sobe o
  serverRoot para a raiz do monorepo; o plugin Gradle passa
  `export:embed --entry-file index.js` **relativo**, com working directory em
  `apps/mobile`. Sem fixar o serverRoot no proprio app, o bundle de release
  falha com `None of these files exist: ..\..\index.js`. O modo debug nunca
  mostra isso, porque o bundle vem do dev server.

## Armadilhas

- Comandos do Expo rodam em `apps/mobile`. Rodar `expo run:android` na raiz gera
  um projeto nativo em `android/` na raiz (que o `.gitignore` não cobre — só
  `apps/mobile/android/`).
- Só mude JS/TS? Fast Refresh basta. Refaça o build nativo apenas ao mexer em
  `app.json`, dependências nativas ou Gradle.
- Erros de rede/RLS do `usePlanner` saem em `console.warn` com o prefixo
  `[Planner Fofo]` (logcat no mobile, DevTools no desktop).
- Janela do desktop em branco é quase sempre erro de JS no renderer; fontes ou
  Supabase falhando costuma ser a CSP do `src/renderer/index.html`.
