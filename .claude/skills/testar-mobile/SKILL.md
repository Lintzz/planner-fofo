---
name: testar-mobile
description: Testa o app mobile (Expo) do Planner Fofo no emulador Android via `npx expo run:android`. Use quando pedirem para rodar, testar, abrir no emulador, validar uma mudança no app mobile, ou investigar por que o app não sobe/crasha no Android.
---

# Testar o Planner Fofo no Android

Roda o app mobile no emulador com `npx expo run:android` (build nativo de
desenvolvimento, não Expo Go — o projeto usa `react-native-svg` e fontes
nativas), depois exercita os fluxos e reporta o que quebrou.

Trabalhe sempre a partir da raiz do monorepo, `D:\Projetos\planner-fofo`.

## Ordem importa

As etapas vão da mais barata para a mais cara. **Não pule para o emulador**: um
erro de tipo ou de resolução de módulo aparece em segundos no passo 2 ou 3 e
levaria 5+ minutos para aparecer como falha de build nativo.

---

## 1. Ambiente

```bash
node scripts/checar-supabase.mjs
```

Tem que sair `Backend de pé. 💗`. Se falhar:

- **"faltam SUPABASE_URL"** → o `.env` da raiz sumiu. Recrie a partir do
  `.env.example`; as credenciais do projeto `fieqaqyzanxvvuurngbj` estão no
  dashboard do Supabase.
- **"tabela não existe"** → migrações não aplicadas. Use o MCP do Supabase
  (`apply_migration`) ou `npm run db:push`.
- **"executou sem login"** → um `revoke` regrediu; é problema de migração, não
  do app. Corrija antes de continuar.

A última linha da saída, `info cadastro`, diz se a confirmação de e-mail está
ligada — leia antes de tentar criar conta no passo 6.

**Como o ambiente chega no app** (não é o caminho padrão do Expo, e a diferença
já custou um red box): o Expo lê `.env` a partir do diretório do app, mas o
nosso mora na **raiz do monorepo**, compartilhado com o desktop. Quem faz a
ponte é `apps/mobile/app.config.js`: ele lê o `.env` da raiz e repassa os
valores por `extra`, que `expo-constants` entrega em runtime e
`src/lib/supabase.ts` injeta com `definirAmbiente()`.

Consequência prática: mexeu no `.env`, **reinicie o processo do Expo**. O
`app.config.js` só é avaliado quando a CLI sobe. Para conferir sem abrir o app:

```bash
cd apps/mobile && npx expo config --type public --json
```

O bloco `extra` tem que trazer `supabaseUrl` e `supabaseAnonKey` preenchidos.

## 2. Tipos

```bash
npm run typecheck --workspace @planner-fofo/mobile
```

Cobre também o `packages/shared` (o tsconfig do mobile inclui `../../packages/shared/src`).

## 3. Bundle (o teste mais valioso antes do emulador)

```bash
npx expo export --platform android --output-dir "$TMPDIR/planner-export"
```

Roda o Metro de verdade e falha se `@planner-fofo/shared` não resolver, se
faltar dependência, ou se houver erro de sintaxe. Leva ~1 min e dispensa
emulador. Um bundle saudável hoje sai com ~2,6 MB de `.hbc` e 21 assets de fonte.

Se falhar com **"Unable to resolve module @planner-fofo/shared"**, olhe
`apps/mobile/metro.config.js`: ele precisa de `watchFolders` apontando para a
raiz do monorepo e de `nodeModulesPaths` com o `node_modules` local **e** o da
raiz.

## 4. Emulador

```bash
adb devices
```

Se a lista vier vazia (só o cabeçalho), suba o AVD antes de continuar. Esta
máquina tem um: **`Pixel_7`**.

```bash
"$ANDROID_HOME/emulator/emulator" -avd Pixel_7 &
adb wait-for-device
```

O emulador leva ~1 min até aparecer como `device`. Não siga para o passo 5
enquanto estiver `offline`.

## 5. Rodar

```bash
cd apps/mobile && npx expo run:android
```

O que esperar:

- **Primeira execução** roda `expo prebuild` e gera `apps/mobile/android/`
  (já está no `.gitignore`), compila com Gradle e instala. Leva vários minutos —
  rode em background e espere, não fique fazendo poll.
- **Execuções seguintes** reaproveitam o build nativo e sobem só o Metro.
- Precisa de **JDK 17** e do **Android SDK**. Nesta máquina os dois já estão
  configurados: `ANDROID_HOME` aponta para o SDK e `JAVA_HOME` para o Adoptium
  JDK 17. **Não se assuste** se `java -version` responder 1.8 — o Java do PATH
  é outro; o Gradle usa `JAVA_HOME`, que está certo. Só investigue a versão do
  JDK se o Gradle reclamar explicitamente.

Rode em background e só depois leia a saída, porque o comando fica preso no
Metro depois de instalar.

Quando mudar apenas JS/TS, **não** rode `run:android` de novo — o Fast Refresh
já pega. Refaça o build nativo só se mudar `app.json`, dependências nativas ou
configuração do Gradle.

## 6. Fluxos a exercitar

Sem sessão o app abre no login. Crie uma conta de teste (o gatilho
`ao_criar_usuaria` já popula 5 hábitos e 8 tags, então as telas nascem cheias).

### Destravar o cadastro

A confirmação de e-mail vem **ligada** no projeto hospedado, então o cadastro
cria a conta mas não devolve sessão — o app volta para a tela de login.

Melhor solução, uma vez só (não dá para fazer por SQL nem pelo MCP; a config de
Auth vem do ambiente do GoTrue, não do banco):

> Dashboard → **Authentication** → **Sign In / Providers** → **Email** →
> desligar **Confirm email** → Save.

Enquanto isso não for feito, dá para confirmar cada conta na mão. Isto é um
`UPDATE` numa linha que já existe, então é seguro (o perigoso é `INSERT` —
veja o aviso abaixo):

```sql
update auth.users
   set email_confirmed_at = now()
 where email_confirmed_at is null;
```

Rode no SQL Editor do dashboard ou peça para o Claude rodar via MCP
(`execute_sql`). Depois é só entrar pela tela de login.

### ⚠️ Nunca crie usuária com `INSERT` em `auth.users`

As colunas de token (`confirmation_token`, `recovery_token`, `email_change`,
`email_change_token_new`) aceitam `NULL`, mas o GoTrue as lê como `string`
não-nula em Go. Uma linha com `NULL` ali **quebra o signup do projeto inteiro**:
toda tentativa passa a devolver `500` e a tela mostra
`Database error finding user`.

Crie a conta pela própria tela de cadastro do app, pelo dashboard
(Authentication → Add user) ou pela Admin API — esses caminhos preenchem as
colunas com `''`. **Apagar** usuária por SQL é seguro; **criar** não é.

Se o erro já apareceu:

```sql
-- quem está com token NULL:
select id, email from auth.users where confirmation_token is null;
-- apague essas linhas; o cascade leva perfil, hábitos, registros e tags.
```

Para ver o erro cru, use o MCP do Supabase (`query_logs`) na fonte `auth_logs`
filtrando `log_attributes['path'] = '/signup'`. Para confirmar que voltou ao
normal, um login com e-mail inexistente tem que devolver `400 invalid_credentials`
(e não `500`) — é o mesmo caminho de leitura da tabela.

Aba por aba:

- **Hoje** — o anel mostra a porcentagem; marcar um hábito preenche o círculo e
  move a barra na hora (atualização otimista). Fechar todos os hábitos previstos
  dispara o confete. As barrinhas da semana marcam a coluna do dia atual.
- **Estudos / Avulsas** — alternar Hoje/Histórico; no Histórico aparecem os
  chips de tag e, ao filtrar por uma, o painel de porcentagem. Criar item pelo
  botão flutuante, marcar, remover. Criar e apagar tag pelo "editar tags".
- **Gráficos** — trocar Semana/Mês/Ano refaz o gráfico; conferir que a
  consistência lista os mesmos hábitos da aba Hoje e que as medalhas acendem.

Duas coisas são **diferentes de propósito** no mobile e não são bugs:

- O anel é SVG (`strokeDasharray`), não `conic-gradient`.
- O seletor de data são os três atalhos mais setas de dia a dia; não existe
  `<input type="date">` no React Native.

Sobre as barras do sistema: o app desenha de ponta a ponta
(`edgeToEdgeEnabled`) e aplica os recuos com `useSafeAreaInsets()` de
`react-native-safe-area-context`. **Não** use `SafeAreaView` do `react-native`:
no Android ela é uma `View` comum e o conteúdo passa por baixo da barra de
status e da barra de gestos. Para conferir sem depender do olho, meça:

```bash
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml
```

Os rótulos das abas têm que terminar bem antes da altura da tela (numa
1080x2400 saudável, ficam em ~2196–2242). No Git Bash, prefixe os comandos com
`MSYS_NO_PATHCONV=1`, senão ele reescreve `/sdcard/...`.

## 7. Logs quando algo quebra

```bash
adb logcat -s ReactNativeJS:V ReactNative:V
```

O `usePlanner` manda todo erro de rede/RLS para `console.warn` com o prefixo
`[Planner Fofo]`, então esses erros aparecem aí.

Falhas comuns:

- **Tela "Falta configurar o Supabase"** (ou red box `variaveis de ambiente
  ausentes`) → `extra` chegou vazio. Rode `npx expo config --type public --json`
  em `apps/mobile` e veja se `app.config.js` está achando o `.env` da raiz.
  Depois reinicie o Expo — a config não recarrega sozinha.
- **Erro de RLS (`new row violates row-level security policy`)** → alguma
  escrita está indo sem `usuario_id` igual ao `auth.uid()`. Olhe a chamada
  correspondente em `packages/shared/src/api/`.
- **Fontes não carregam (texto no tipo do sistema)** → confira os nomes em
  `apps/mobile/src/tema.ts` contra o que o `useFonts` registra em `App.tsx`.

## Ao terminar

Reporte, nesta ordem: o que passou, o que falhou com a saída literal do erro, e
qual arquivo provavelmente causa. Se o build nativo nem começou, diga em qual
pré-requisito parou (JDK, SDK, emulador) em vez de tentar contornar.
