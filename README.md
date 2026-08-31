<div align="center">

# Planner Fofo 🌸

**Planner de hábitos, estudos e tarefas — para desktop e celular, com o mesmo núcleo e o mesmo banco.**

[![Release](https://img.shields.io/github/v/release/Lintzz/planner-fofo?style=flat-square&color=ff8fc4&label=vers%C3%A3o)](https://github.com/Lintzz/planner-fofo/releases/latest)
[![Download](https://img.shields.io/github/downloads/Lintzz/planner-fofo/total?style=flat-square&color=b78af0&label=downloads)](https://github.com/Lintzz/planner-fofo/releases)
[![Windows](https://img.shields.io/badge/Windows-instalador-8fc3ff?style=flat-square)](https://github.com/Lintzz/planner-fofo/releases/latest)
[![Android](https://img.shields.io/badge/Android-Expo-7fd8b8?style=flat-square)](#android)

</div>

---

## O que é

Um planner sem culpa: hábitos fixos com agenda semanal, duas listas leves
(Estudos e Avulsas) e gráficos que mostram constância em vez de cobrança.

O app existe em duas casas — uma janela no Windows e um app Android — e as duas
compartilham o mesmo núcleo TypeScript e o mesmo Supabase. Marcar um hábito no
celular muda o anel do desktop, porque não há duas implementações da mesma
regra: há uma só, em `packages/shared`.

|  | |
| --- | --- |
| **Hoje** | Anel de progresso do dia, cartões de hábito com as barrinhas da semana, confete ao fechar o dia |
| **Estudos / Avulsas** | Listas por matéria ou categoria, com histórico e filtro por tag — fora da porcentagem, de propósito |
| **Gráficos** | Semana / Mês / Ano, consistência por hábito, sequência atual e conquistas |

---

## ⬇️ Download

### Windows

Baixe o instalador mais recente em **[Releases](https://github.com/Lintzz/planner-fofo/releases/latest)**
(`PlannerFofo-x.y.z-setup.exe`) e execute. A instalação é por usuária, sem pedir
administrador.

> **O app se atualiza sozinho.** Ao abrir, ele consulta as releases deste
> repositório, baixa a versão nova em segundo plano e pergunta se você quer
> reiniciar. Detalhes em [Atualização automática](#-atualização-automática-desktop).

### Android

O APK sai em **[Releases](https://github.com/Lintzz/planner-fofo/releases/latest)**
(`PlannerFofo-x.y.z.apk`). Como não vem da Play Store, o Android pede para
liberar *"instalar apps desconhecidos"* para o navegador ou gerenciador de
arquivos na primeira vez.

Para gerar o seu, veja [APK do Android](#-apk-do-android).

---

## 🏗 Arquitetura

```
planner-fofo/
├── apps/
│   ├── mobile/            React Native + Expo (SDK 54)
│   └── desktop/           Electron + React + Vite (electron-vite)
├── packages/
│   └── shared/            Núcleo compartilhado — sem React Native, sem DOM
│       └── src/
│           ├── env.ts               resolução de ambiente por plataforma
│           ├── supabase.ts          cliente Supabase centralizado
│           ├── theme.ts             design tokens
│           ├── types.ts             modelo de domínio
│           ├── database.types.ts    tipos do banco (regeneráveis)
│           ├── lib/datas.ts         datas no fuso local
│           ├── lib/regras.ts        regras de negócio puras
│           ├── api/                 camada de dados sobre o Supabase
│           └── react/usePlanner.ts  estado, compartilhado pelos dois apps
├── supabase/migrations/   schema, RLS + onboarding, funções de estatística
└── scripts/               sanidade do backend e geração dos ícones
```

**A regra que sustenta o resto:** comportamento mora no `shared`; os apps só
desenham. `usePlanner` é React puro, sem UI — mobile e desktop consomem o mesmo
estado e as mesmas ações, então os dois sempre mostram o mesmo número. Uma regra
implementada só num app é bug: os valores vão divergir.

O `shared` nunca é compilado. `main`/`types` apontam para `src/index.ts` e cada
app transpila o TypeScript junto — via `alias` no `electron.vite.config.ts` e
`watchFolders` no `metro.config.js`.

### Stack

| Camada | Escolha |
| --- | --- |
| Núcleo | TypeScript strict, sem dependência de UI |
| Desktop | Electron 44 · React 19 · Vite 5 · electron-vite |
| Mobile | React Native 0.81 · Expo SDK 54 · react-native-svg |
| Backend | Supabase (Postgres + Auth + RLS) |
| Distribuição | electron-builder (NSIS) + electron-updater |

---

## 🚀 Rodando o projeto

**Pré-requisitos:** Node 20+ e um projeto Supabase. Para o Android, JDK 17 e o
Android SDK.

```bash
git clone https://github.com/Lintzz/planner-fofo.git
cd planner-fofo
npm install

cp .env.example .env      # preencha com a URL e a chave pública do seu projeto
npm run check:db          # confere o backend antes de abrir qualquer app

npm run desktop           # Electron + Vite com hot reload
npm run mobile            # Expo dev server
```

Para o Android com build nativo (o projeto usa fontes e SVG nativos, então não
roda no Expo Go):

```bash
cd apps/mobile && npx expo run:android
```

### O `.env` mora na raiz

Existe **um `.env` só**, na raiz do monorepo, e nenhum dos dois apps o encontra
pelo caminho padrão:

- **Desktop** — `envDir` no `electron.vite.config.ts` aponta o Vite para a raiz;
  o renderer lê `import.meta.env.VITE_*` e injeta com `definirAmbiente()`.
- **Mobile** — `apps/mobile/app.config.js` lê o `.env` da raiz quando a CLI monta
  a config e repassa por `extra`, que o `expo-constants` entrega em runtime.

Nos dois casos a config é lida quando o processo sobe: **mexeu no `.env`,
reinicie o dev server.** Para conferir o lado mobile sem abrir o app,
`cd apps/mobile && npx expo config --type public --json` — o bloco `extra` tem
que vir preenchido.

Só chaves públicas entram no `.env`. A `service_role` ignora o RLS e não pode
viver num app distribuído.

---

## 🗄 Supabase

Migrações em `supabase/migrations/`, na ordem em que foram aplicadas:

| Migração | O que faz |
| --- | --- |
| `schema_inicial` | tipos, tabelas, índices e gatilhos de integridade |
| `rls_e_onboarding` | RLS em todas as tabelas + conta nova já povoada |
| `funcoes_estatisticas` | `resumo_periodo`, `pct_do_dia`, `streak_atual`, `consistencia` |
| `resumo_periodo_ignora_antes_da_rotina` | dia anterior ao primeiro hábito não vale 100% |
| `restringe_funcoes_de_gatilho` | funções de gatilho saem de `/rest/v1/rpc/` |
| `revoga_execute_de_public_nas_funcoes` | fecha as RPCs de estatística para anônimo |
| `resumo_conquistas` | conquistas medem ação (marcações), não configuração |

```bash
npm run db:push     # aplica no projeto linkado
npm run db:types    # regenera packages/shared/src/database.types.ts
npm run db:reset    # stack local (precisa de Docker)
```

### Modelo de dados

| Tabela | Papel |
| --- | --- |
| `perfis` | preferências (nome, acento, anel circular, comemoração) |
| `habitos` | hábitos fixos, com `agenda boolean[7]` (índice 1 = segunda, `isodow`) |
| `habito_registros` | uma linha por dia concluído — desmarcar apaga a linha |
| `tags` | matérias (Estudos) e categorias (Avulsas) |
| `itens` | itens das duas listas leves |

Toda tabela tem RLS e a conta só enxerga as próprias linhas. Ao criar a conta, o
gatilho `ao_criar_usuaria` monta perfil, cinco hábitos de exemplo e as oito tags
iniciais — a usuária cai num app cheinho.

### Decisões que valem registrar

- **A presença do registro é o "feito".** Nada de `feito boolean` em
  `habito_registros`: a tabela fica enxuta e as contagens viram somas diretas.
- **Um dia sem hábitos previstos vale 100%.** Dia de descanso não quebra a
  sequência. A regra é idêntica no Postgres (`resumo_periodo`) e no cliente
  (`porcentagemDoDia`), para os dois números nunca divergirem. Mas ela não vale
  para antes da rotina existir: dias anteriores ao primeiro hábito voltam como
  `0`, senão uma conta nova abriria a aba Gráficos com a semana toda em 100%.
- **Hoje incompleto não zera a sequência.** `streak_atual` conta a partir de
  ontem enquanto o dia ainda está em andamento.
- **As listas não entram na porcentagem nem nos gráficos** — é a promessa da
  "Zona sem pressão" no próprio design.
- **`usuario_id` é denormalizado** em `habito_registros` e `itens` para que as
  policies de RLS sejam um teste direto, sem subconsulta; gatilhos garantem que
  a denormalização não possa divergir do pai.
- **Estatísticas são calculadas no banco**, para não baixar meses de histórico só
  para desenhar um gráfico.

---

## 🔄 Atualização automática (desktop)

O `electron-builder` publica, junto do instalador, um `latest.yml` com a versão e
o hash de cada artefato. O `electron-updater` (`src/main/atualizador.ts`) lê esse
arquivo na release mais recente do repositório e compara com a versão em
execução.

```
app abre ──8s──> consulta a última release ──> versão nova?
                          │                        │ sim
                     não  │                        ▼
                          ▼               baixa em segundo plano
                    nada acontece                  │
                                                   ▼
                                       "A versão x.y.z chegou! 🌸"
                                    ┌──────────────┴──────────────┐
                                "Reiniciar agora"             "Depois"
                                    │                             │
                              instala e reabre        instala ao fechar o app
```

Detalhes que importam:

- Só roda com `app.isPackaged` — em desenvolvimento fica desligado.
- Reconsulta a cada 6 horas, além da checagem inicial.
- Falha de rede vira `console.warn`, nunca uma caixa de erro na cara da usuária.
- O NSIS é configurado como `perMachine: false`, então a atualização se instala
  sem prompt de administrador.
- O nome do artefato não tem espaços de propósito: o GitHub troca espaço por
  ponto no nome do asset e o `latest.yml` deixaria de casar com a URL.

### Publicando uma versão nova

```bash
# 1. sobe a versão nos quatro arquivos de uma vez (desktop, mobile e raiz)
npm run versao 1.1.0

# 2. build + upload da release (precisa de GH_TOKEN com escopo `repo`)
GH_TOKEN=$(gh auth token) npm run desktop:release

# 3. o APK do Android, para anexar na mesma release
npm run mobile:apk
```

`npm run versao` sem argumento só confere se os quatro arquivos estão na mesma
versão — vale rodar antes de publicar. O `versionCode` do Android não entra
nessa lista porque é derivado da versão em `app.config.js`, então anda sozinho.

O `electron-builder` cria a release `v1.1.0` e envia o instalador, o `.blockmap`
e o `latest.yml`. Todo app instalado pega a atualização na próxima abertura.

Para gerar o instalador **sem** publicar: `npm run desktop:package` (sai em
`apps/desktop/release/`).

---

## 📱 APK do Android

O build é **local**, com o Gradle do projeto nativo. Não precisa de conta no Expo
nem do EAS Build:

```bash
npm run mobile:apk     # -> apps/mobile/release/PlannerFofo-x.y.z.apk
```

O script roda o Gradle, confere com qual chave o APK saiu assinado e copia o
arquivo já com o número da versão.

### Assinatura

O template do React Native assina o build de release com a **chave de debug** —
a mesma chave pública que vem no SDK, igual na máquina de todo mundo. Um APK
assim instala, mas qualquer pessoa consegue publicar uma "atualização" que o
Android aceita como sendo do mesmo app.

Trocar isso à mão em `android/app/build.gradle` não resolve: a pasta `android/`
é gerada pelo `expo prebuild` e está no `.gitignore`, então a edição some no
próximo `--clean`. Por isso a troca mora num config plugin,
`apps/mobile/plugins/assinatura-android.js`, que o Expo reaplica toda vez que
regenera o projeto nativo.

As credenciais **não** ficam no repositório. O Gradle as lê de
`~/.gradle/gradle.properties`:

```properties
PLANNER_FOFO_KEYSTORE=/caminho/para/planner-fofo-release.p12
PLANNER_FOFO_KEY_ALIAS=planner-fofo
PLANNER_FOFO_KEYSTORE_PASSWORD=...
PLANNER_FOFO_KEY_PASSWORD=...
```

Para criar a sua chave:

```bash
keytool -genkeypair -v -storetype PKCS12   -keystore planner-fofo-release.p12 -alias planner-fofo   -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ **Guarde o arquivo `.p12` e a senha.** O Android só aceita atualizar um app
> instalado se o APK novo vier assinado com a **mesma** chave. Perdeu a chave,
> perdeu a possibilidade de atualizar — quem já tem o app precisa desinstalar e
> instalar de novo, perdendo os dados locais.

Sem essas propriedades o build cai de volta na chave de debug, de propósito:
quem clonou só para mexer no código continua conseguindo compilar. O
`npm run mobile:apk` avisa em letras grandes quando isso acontece.

### Testar antes de publicar

O build de debug pega o bundle do dev server e mantém os fallbacks de
desenvolvimento ligados — ele **esconde** uma classe inteira de erro que só
aparece no APK de release. Rode o APK no emulador antes de distribuir:

```bash
adb install -r apps/mobile/release/PlannerFofo-1.0.0.apk
adb logcat -b crash
```

As armadilhas já encontradas (todas matavam o app no primeiro render) estão
documentadas em `CLAUDE.md`: `ActivityIndicator` sob a New Architecture, a ordem
do polyfill de `URL` e React Native duplicado no monorepo.

### Atualização

O Android não tem o equivalente ao `electron-updater`: um app fora de loja não
pode se substituir sozinho. Dois caminhos, se isso virar necessidade:

- **EAS Update** — atualiza o *bundle JS* pelo ar, sem loja. Cobre a maior parte
  das mudanças (telas, regras, textos); não cobre dependência nativa nova.
- **Checagem de versão** — o app compara a própria versão com a última release do
  GitHub e abre o link do APK. Simples, mas a instalação continua manual.

---

## 🛠 Scripts

| Comando | O que faz |
| --- | --- |
| `npm run desktop` | Electron + Vite com HMR |
| `npm run desktop:build` | bundles em `apps/desktop/out` |
| `npm run desktop:package` | instalador em `apps/desktop/release` |
| `npm run desktop:release` | build + publica a release no GitHub |
| `npm run mobile` | Expo dev server |
| `npm run mobile:android` | `expo run:android` no workspace mobile |
| `npm run mobile:apk` | APK de release assinado, em `apps/mobile/release` |
| `npm run typecheck` | TypeScript em todos os workspaces |
| `npm run check:db` | sanidade do backend com a chave pública (sai 1 se falhar) |
| `npm run icones` | regenera os ícones dos dois apps (PNG procedural) |
| `npm run versao` | mostra ou sobe a versão de todos os apps de uma vez |

Não há suíte de testes automatizados. A validação vai do mais barato ao mais
caro — `check:db` → `typecheck` → build/bundle → app rodando — e está descrita
passo a passo nas skills `.claude/skills/testar-desktop` e
`.claude/skills/testar-mobile`.

---

## 🎨 Diferenças conscientes entre as plataformas

O design é um só, mas duas coisas não têm equivalente direto no React Native:

- **Anel de progresso** — o `conic-gradient` do CSS não existe no RN; o mobile
  desenha o mesmo arco com um círculo `react-native-svg` e `strokeDasharray`.
- **Seletor de data** — o `<input type="date">` só existe na web. No mobile os
  três atalhos (Ontem / Hoje / Amanhã) ganham um passo a passo de dias ao lado.

O mobile também aplica os recuos com `useSafeAreaInsets()`, nunca com o
`SafeAreaView` do `react-native`: no Android ele é uma `View` comum e o conteúdo
passa por baixo da barra de status.

Tipografia (Baloo 2 + Nunito), paletas, raios e sombras vêm dos artboards de
referência `Planner Fofo.dc.html` (mobile) e `Planner Fofo Web.dc.html` (desktop),
centralizados em `packages/shared/src/theme.ts`.
