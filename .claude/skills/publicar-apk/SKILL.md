---
name: publicar-apk
description: Gera o APK de release do Planner Fofo pelo EAS Build local e publica no GitHub — lê a última release, sobe a versão nos quatro arquivos, comita tudo, dá push e anexa **só o .apk** na release da versão (criando a release se ainda não existir, ou editando a que o desktop já criou). Use quando pedirem para buildar, gerar, assinar ou publicar o APK / o app Android.
---

# Publicar o APK do Android

Isto **publica para fora**. Confirme o número da versão com a usuária antes do
passo 4 e não mexa em asset nenhum da release que não seja o `.apk`.

Trabalhe a partir da raiz do monorepo, `D:\Projetos\planner-fofo`; os comandos
do Expo/EAS rodam em `apps/mobile`.

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
eas whoami                     # conta Expo que guarda o keystore
npm run versao                 # confere se os 4 arquivos estão alinhados
```

O build local do EAS gasta vários GB em disco e uns 10–20 min de Gradle. Não
comece se a máquina estiver ocupada com outro build.

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

O EAS empacota o projeto a partir do git: **arquivo não comitado pode não entrar
no build**, e em `--non-interactive` ele nem começa com a árvore suja. Então
comite antes, sempre.

```bash
git add -A
git commit    # mensagem em pt-BR, corpo explicando o porquê, trailers do Claude Code
git push
```

O push precisa vir antes da release: a tag aponta para o commit publicado.

## 5. Gerar o APK

```bash
cd apps/mobile
eas build --profile preview --platform android --local --non-interactive \
  --output ./PlannerFofo-1.1.0.apk
```

**Rode em background** — o Gradle prende o terminal por 10–20 min. Espere a
notificação, não fique fazendo poll.

Por que `preview` e não os outros perfis de `eas.json`:

| Perfil | Por que não/sim |
| --- | --- |
| `development` | precisa do `expo-dev-client` e de um Metro rodando — não serve para distribuir |
| **`preview`** | **APK autônomo, bundle embutido, assinado — é o que se publica** |
| `production` | sai `.aab`, formato só da Play Store; o Android não instala |

O nome do arquivo segue o padrão dos assets já publicados
(`PlannerFofo-1.0.0.apk`). `apps/mobile/*.apk` é gitignorado — o APK não entra
no commit, só na release.

O EAS local roda o próprio `expo prebuild` num diretório temporário, então
`apps/mobile/android/` (que existe só para o `expo run:android`) não influencia
o resultado. O `.env` da **raiz** chega no bundle por `app.config.js` → `extra`;
se ele sumir, o app abre na tela "Falta configurar o Supabase".

## 6. Conferir o APK antes de publicar

Rodar bem em debug não diz **nada** sobre o release. Três crashes que só
apareciam no APK já custaram um build cada (`ActivityIndicator`, ordem do
polyfill de `URL`, React Native duplicado — todos no `CLAUDE.md`).

```bash
# versão e versionCode carimbados de verdade
"$ANDROID_HOME/build-tools/"*/aapt dump badging PlannerFofo-1.1.0.apk | head -2

# instalar no emulador (a skill testar-mobile sobe o AVD Pixel_7)
adb install -r PlannerFofo-1.1.0.apk
adb logcat -b crash
```

Confirme só que o app **abre e sobrevive ao primeiro render**. O teste de
verdade é da usuária — não navegue pelas telas nem crie conta.

### Assinatura

O Android só aceita instalar por cima se a chave for a **mesma** do APK
anterior. Quem guarda a chave agora é o EAS (`eas credentials`), e o APK 1.0.0
saiu de um keystore local que não existe mais no repositório — então **compare
antes de publicar**:

```bash
keytool -printcert -jarfile PlannerFofo-1.1.0.apk | grep -i "SHA256"
gh release download v1.0.0 --pattern "*.apk" --dir /tmp/apk-anterior
keytool -printcert -jarfile /tmp/apk-anterior/*.apk | grep -i "SHA256"
```

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

## Ao terminar

Diga a versão publicada, cole a URL da release, liste os assets que ficaram nela
e avise se a assinatura mudou em relação ao APK anterior. Se parou no meio, diga
em qual passo e se o commit/push já foi. Para o instalador do Windows na mesma
release, é a skill `publicar-desktop`.
