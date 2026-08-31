---
name: testar-mobile
description: Sobe o app mobile (Expo) do Planner Fofo no emulador Android com `npx expo run:android` para a usuária testar na mão. Use quando pedirem para rodar, abrir no emulador ou subir o app mobile.
---

# Subir o Planner Fofo no Android

**Quem testa é a usuária.** Esta skill só coloca o app rodando no emulador e
devolve o controle. Não navegue pelo app, não crie conta, não exercite fluxos e
não fique conferindo tela — a menos que peçam explicitamente.

Trabalhe a partir da raiz do monorepo, `D:\Projetos\planner-fofo`.

## 1. Emulador

```bash
adb devices
```

Se a lista vier vazia (só o cabeçalho), suba o AVD. Esta máquina tem um:
**`Pixel_7`**.

```bash
"$ANDROID_HOME/emulator/emulator" -avd Pixel_7 &
adb wait-for-device
```

Leva ~1 min até aparecer como `device`. Não siga enquanto estiver `offline`.

## 2. Rodar

```bash
cd apps/mobile && npx expo run:android
```

**Rode em background** — o comando fica preso no Metro depois de instalar.

- **Primeira execução** roda `expo prebuild`, gera `apps/mobile/android/`
  (gitignorada), compila com Gradle e instala. Leva vários minutos. Espere pela
  notificação, não fique fazendo poll.
- **Execuções seguintes** reaproveitam o build nativo e sobem só o Metro.
- Precisa de **JDK 17** e do **Android SDK**, os dois já configurados aqui
  (`JAVA_HOME` no Adoptium 17, `ANDROID_HOME` no SDK). **Não se assuste** se
  `java -version` responder 1.8 — o Java do PATH é outro; o Gradle usa
  `JAVA_HOME`. Só investigue isso se o Gradle reclamar explicitamente.

Quando mudar só JS/TS, **não** rode `run:android` de novo — o Fast Refresh já
pega. Refaça o build nativo só ao mexer em `app.json`, dependências nativas ou
Gradle.

Assim que o app instalar e o Metro subir, avise que está no ar e pare por aí.

## 3. Se não subir

Logs do app (o `usePlanner` manda erro de rede/RLS para `console.warn` com o
prefixo `[Planner Fofo]`):

```bash
adb logcat -s ReactNativeJS:V ReactNative:V
```

Falhas comuns:

- **Tela "Falta configurar o Supabase"** (ou red box `variaveis de ambiente
  ausentes`) → o `extra` chegou vazio. O `.env` mora na **raiz do monorepo** e
  `apps/mobile/app.config.js` faz a ponte por `extra`. Confira com
  `cd apps/mobile && npx expo config --type public --json` e reinicie o Expo —
  a config só é avaliada quando a CLI sobe.
- **"Unable to resolve module @planner-fofo/shared"** → `metro.config.js`
  precisa de `watchFolders` na raiz e `nodeModulesPaths` com o `node_modules`
  local **e** o da raiz.
- **Erro de view config (`RCTText`, `AndroidProgressBar`)** → veja a seção
  "Bugs que SO aparecem no build de release" no `CLAUDE.md`; comece por
  `npm ls react-native`.

Se quiser pegar erro de tipo ou de resolução antes de gastar minutos de Gradle:

```bash
npm run typecheck --workspace @planner-fofo/mobile
```

## Ao terminar

Diga que o app está rodando e que o teste é com ela. Se nem chegou a instalar,
diga em qual passo parou com a saída literal do erro.
