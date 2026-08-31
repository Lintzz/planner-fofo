---
name: publicar-apk
description: Gera o APK de release do Planner Fofo pelo Gradle local e publica no GitHub — lê a última release, sobe a versão nos quatro arquivos, comita tudo, dá push e anexa **só o .apk** na release da versão (criando a release se ainda não existir, ou editando a que o desktop já criou). Use quando pedirem para buildar, gerar, assinar ou publicar o APK / o app Android.
---

# Publicar o APK do Android

Isto **publica para fora**. Confirme o número da versão com a usuária antes do
passo 4 e não mexa em asset nenhum da release que não seja o `.apk`.

Trabalhe a partir da raiz do monorepo, `D:\Projetos\planner-fofo`; os comandos
do Expo e do Gradle rodam em `apps/mobile`.

**O mobile não tem atualização automática, de propósito.** Publicar = colocar um
APK novo na release; quem usa baixa e instala por cima. Não instale
`expo-updates` para tentar melhorar isso.

Se a intenção for só testar no emulador, **não use esta skill**: a skill
`testar-mobile` (`npx expo run:android`) é bem mais rápida.

## 0. Antes de tudo

```bash
git branch --show-current      # tem que ser main
git status -sb
gh auth status                 # precisa do escopo repo
npm run versao                 # confere se os 4 arquivos estão alinhados
grep -c PLANNER_FOFO ~/.gradle/gradle.properties   # tem que dar 4
```

Essas quatro propriedades são a assinatura do APK (passo 5). **Sem elas o build
não falha** — sai assinado com a chave de debug, e um APK assim não instala por
cima de quem já tem o app.

O Gradle gasta vários GB em disco e uns 7–20 min. Não comece se a máquina
estiver ocupada com outro build.

## 1. Descobrir a versão alvo

A última versão publicada é a **maior tag**, não a mais recente por data:

```bash
gh release list --limit 50 --json tagName --jq '.[].tagName' \
  | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1
gh release view v1.1.0 --json assets --jq '.assets[].name'   # o que já tem lá
```

Decida assim:

| Situação | Alvo |
| --- | --- |
| local **maior** que a publicada | o alvo é a local — o bump já foi feito, não bumpe de novo |
| release do alvo existe mas **sem `.apk`** (o desktop publicou sozinho) | mesma versão: o APK entra nessa release |
| release do alvo já tem `.apk` | um bump novo (patch, salvo se pedirem minor/major) |
| os 4 arquivos divergindo | realinhe com `npm run versao <alvo>` |

**Diga o número escolhido e espere o "pode ir"** antes do passo 4.

## 2. Subir a versão

```bash
npm run versao 1.1.0
```

Escreve nos quatro arquivos de uma vez. O `versionCode` do Android **não** entra
nessa lista porque é derivado da versão em `app.config.js` (1.1.0 → 10100) —
anda sozinho. Ele é o número que manda na atualização: se ficar igual ao do APK
anterior, o Android trata a versão nova como se fosse a mesma.

Minor e patch vão até 99 na fórmula (`versionCodeDe()` em `app.config.js`); o
script recusa versões que não cabem.

## 3. Conferir que compila

```bash
npm run typecheck --workspace @planner-fofo/mobile
npm ls react-native            # tem que aparecer UMA cópia só
```

Duas cópias de `react-native` no monorepo = `View config getter callback for
component RCTText must be a function`, e o app morre no primeiro render **só no
release**. Confira aqui, antes de gastar os minutos de Gradle.

## 4. Comitar tudo e dar push

O Gradle compila a árvore de trabalho, então um arquivo não comitado *entra* no
APK — o risco aqui é o inverso: publicar um binário que não corresponde a commit
nenhum, e não ter como reproduzir depois. Comite antes, sempre.

```bash
git add -A
git commit    # mensagem em pt-BR, corpo explicando o porquê, trailers do Claude Code
git push
```

O push precisa vir antes da release: a tag aponta para o commit publicado.

## 5. Gerar o APK

O APK sai do **Gradle local**, em duas etapas, a partir de `apps/mobile`:

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew.bat assembleRelease     # ./gradlew fora do Windows
```

**Rode em background** — o Gradle prende o terminal por 7–20 min. Espere a
notificação, não fique fazendo poll.

O resultado sai em `android/app/build/outputs/apk/release/app-release.apk`.
Copie com o nome que os assets publicados usam (`PlannerFofo-1.0.0.apk`);
`apps/mobile/*.apk` é gitignorado, o APK não entra no commit, só na release:

```bash
cp android/app/build/outputs/apk/release/app-release.apk ../PlannerFofo-1.1.0.apk
```

O `--clean` não é enfeite: `apps/mobile/android/` é gitignorada mas sobrevive
entre builds, inclusive com um `app/build.gradle` de uma versão anterior do
plugin de assinatura. Regenerar do zero é a única forma de saber o que foi
compilado.

O `.env` da **raiz** chega no bundle por `app.config.js` → `extra`; se ele
sumir, o app abre na tela "Falta configurar o Supabase".

### De onde vem a assinatura

`apps/mobile/plugins/assinatura-android.js` é um config plugin: durante o
`prebuild` ele reescreve `android/app/build.gradle` trocando a chave de debug do
template pela de verdade. As credenciais **não estão no repositório** — o Gradle
lê de `~/.gradle/gradle.properties`:

```
PLANNER_FOFO_KEYSTORE=C:/Users/<voce>/.keystores/planner-fofo-release.p12
PLANNER_FOFO_KEY_ALIAS=planner-fofo
PLANNER_FOFO_KEYSTORE_PASSWORD=...
PLANNER_FOFO_KEY_PASSWORD=...
```

Sem essas propriedades o plugin volta para a chave de debug **de propósito**,
para quem clonou o projeto conseguir compilar sem ter a chave de ninguém. Quer
dizer: um APK assinado errado sai calado, sem erro nenhum. Por isso o passo 6
confere o fingerprint sempre, e não só quando alguém mexeu na assinatura. Para
ver qual chave o Gradle vai usar sem gastar um build inteiro:

```bash
cd apps/mobile/android && ./gradlew.bat :app:signingReport --console=plain
```

### Por que não `eas build --local`

**Não roda no Windows.** Morre na hora, antes de compilar qualquer coisa:

```
Unsupported platform, macOS or Linux is required to build apps for Android
```

O `eas.json` e o `credentials.json` (fora do git, carrega a senha do keystore)
continuam válidos para um build **na nuvem** — `eas build --profile preview
--platform android`, sem o `--local`, que é o único modo do EAS que funciona
daqui. Esse caminho nunca foi exercitado neste projeto; se um dia for, confira o
fingerprint do jeito do passo 6 antes de publicar. Os perfis de `eas.json`:

| Perfil | Para que serve |
| --- | --- |
| `development` | precisa do `expo-dev-client` e de um Metro rodando — não distribui |
| **`preview`** | APK autônomo, bundle embutido, assinado — é o formato que se publica |
| `production` | sai `.aab`, formato só da Play Store; o Android não instala |

## 6. Conferir o APK antes de publicar

Rodar bem em debug não diz **nada** sobre o release. Três crashes que só
apareciam no APK já custaram um build cada (`ActivityIndicator`, ordem do
polyfill de `URL`, React Native duplicado — todos no `CLAUDE.md`).

```bash
# o arquivo chegou inteiro? (uma cópia truncada tem o tamanho certo e nada dentro)
unzip -t PlannerFofo-1.1.0.apk | tail -1

# versão e versionCode carimbados de verdade
"$ANDROID_HOME/build-tools/"*/aapt.exe dump badging PlannerFofo-1.1.0.apk | head -2

# instalar no emulador (a skill testar-mobile sobe o AVD Pixel_7)
adb install PlannerFofo-1.1.0.apk
adb logcat -b crash
```

Se o emulador responder `INSTALL_FAILED_UPDATE_INCOMPATIBLE: signatures do not
match`, é sujeira dele, não do APK: sobrou um `expo run:android` instalado com a
chave de debug. `adb uninstall com.plannerfofo.app` e instale de novo. Isso não
diz nada sobre o celular de quem usa o app — quem manda ali é o fingerprint.

Confirme só que o app **abre e sobrevive ao primeiro render**. O teste de
verdade é da usuária — não navegue pelas telas nem crie conta.

### Assinatura

O Android só aceita instalar por cima se a chave for a **mesma** do APK
anterior. A chave é o `planner-fofo-release.p12` de `~/.keystores/`, que o
Gradle acha pelas propriedades do passo 5 — e que sai calado pela de debug se
elas sumirem. **Compare antes de publicar, sempre:**

```bash
BT="$ANDROID_HOME/build-tools/37.0.0"
"$BT/apksigner.bat" verify -v PlannerFofo-1.1.0.apk | head -3
"$BT/apksigner.bat" verify --print-certs PlannerFofo-1.1.0.apk | grep -i "SHA-256 digest"

gh release download v1.0.1 --pattern "*.apk" --dir "$CLAUDE_JOB_DIR/tmp/anterior"
"$BT/apksigner.bat" verify --print-certs "$CLAUDE_JOB_DIR"/tmp/anterior/*.apk \
  | grep -i "SHA-256 digest"
```

A chave certa é `CN=Planner Fofo, O=Alexandre Lintz`, fingerprint SHA-256
`a8d3775dddb2f484b3f00c35fc38e749dfa805adfd9025d15b3331dba28a3c88` — a mesma
desde o 1.0.0. Compare com o APK da **última release publicada**, não com esse
número escrito aqui.

Se os fingerprints **não** baterem, a instalação por cima falha com conflito de
assinatura. Nesse caso não esconda o problema: avise a usuária e escreva nas
notas da release que é preciso desinstalar a versão anterior antes de instalar
(os dados ficam no Supabase; só o login se perde).

## 7. Publicar — só o `.apk`

A release pode já existir com o instalador do desktop. Os dois caminhos:

```bash
# a) release já existe -> anexa/substitui SÓ o APK, sem tocar no resto
gh release upload v1.1.0 apps/mobile/PlannerFofo-1.1.0.apk --clobber

# b) release ainda não existe -> cria com o APK sozinho
gh release create v1.1.0 apps/mobile/PlannerFofo-1.1.0.apk \
  --target main --title "Planner Fofo 1.1.0 🌸" --notes-file <arquivo>
```

Nunca use `gh release create` quando a release já existe, e nunca apague o
`.exe`, o `.blockmap` ou o `latest.yml`: sem esses três o desktop instalado para
de se atualizar.

Se a release já tinha notas (escritas pela skill `publicar-desktop`), **some** a
parte do Android ao texto existente — não sobrescreva.

## 8. Conferir

```bash
gh release view v1.1.0 --json assets --jq '.assets[].name'
```

## Armadilhas que já custaram tempo

- **`metro.config.js` tem duas metades e as duas são necessárias.**
  `unstable_serverRoot` conserta o build de release (`export:embed` resolve o
  entry relativo a `apps/mobile`); `EXPO_NO_METRO_WORKSPACE_ROOT=1` conserta o
  dev-client. Mexer em uma quebra o outro modo.
- **Nada de `ActivityIndicator`** neste app: no Android ele cai no
  `AndroidProgressBar`, que a New Architecture não registra, e o release morre.
  Use `src/componentes/Rodinha.tsx`.
- **`react-native-url-polyfill` é chamado dentro de `obterSupabase()`**, não no
  topo de um módulo — o RN reinstala o `URL` dele durante o `runApplication` e
  ganharia a corrida.
- **Comandos do Expo rodam em `apps/mobile`.** Na raiz, o `expo run:android`
  gera um `android/` e um `app.json` de lixo.
- **`eas build --local` não funciona no Windows** — ver o passo 5. O APK sai do
  Gradle direto; o EAS só serviria na nuvem.
- **Confira o APK depois de copiar, não só depois de gerar.** Em 31/08/2026 a
  máquina perdeu energia no meio da publicação: o `app-release.apk` do Gradle
  ficou perfeito, mas a cópia com o nome da release ficou com o tamanho certo e
  o conteúdo vazio — o NTFS gravou o tamanho no journal e os dados morreram no
  cache. `unzip -t` pega isso; olhar o `ls -la` não.

## Ao terminar

Diga a versão publicada, cole a URL da release, liste os assets que ficaram nela
e avise se a assinatura mudou em relação ao APK anterior. Se parou no meio, diga
em qual passo e se o commit/push já foi. Para o instalador do Windows na mesma
release, é a skill `publicar-desktop`.
