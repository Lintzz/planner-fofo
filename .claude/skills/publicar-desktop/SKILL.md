---
name: publicar-desktop
description: Publica uma versão nova do desktop do Planner Fofo — lê a última release do GitHub, sobe a versão nos quatro arquivos, comita tudo, dá push, gera o instalador (.exe) com electron-builder e cria/atualiza a release no GitHub. Use quando pedirem para buildar, empacotar, lançar ou publicar o app desktop.
---

# Publicar o desktop (instalador + release)

Isto **publica para fora**: cria uma release pública e todo app instalado vai
baixar essa versão sozinho na próxima abertura (`electron-updater`). Confirme o
número da versão com a usuária antes do passo 4 e não repita nenhum passo "só
para ver" depois que a release estiver no ar.

Trabalhe a partir da raiz do monorepo, `D:\Projetos\planner-fofo`.

Se a intenção for só gerar um instalador para testar na máquina, **não use esta
skill**: `npm run desktop:package` (sai em `apps/desktop/release/`, sem publicar).

## 0. Antes de tudo

```bash
git branch --show-current      # tem que ser main
git status -sb                 # veja o que vai entrar no commit
gh auth status                 # precisa do escopo repo
npm run versao                 # confere se os 4 arquivos estão alinhados
```

Se estiver em outra branch, pergunte antes de continuar — a release aponta para
o commit da branch padrão.

## 1. Descobrir a versão alvo

A última versão publicada é a **maior tag**, não a mais recente por data:

```bash
gh release list --limit 50 --json tagName --jq '.[].tagName' \
  | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1
```

Compare com a versão local (`npm run versao`) e decida:

| Situação | Alvo |
| --- | --- |
| local **maior** que a publicada | o alvo é a local — o bump já foi feito, não bumpe de novo |
| local **igual** à publicada | um bump novo (patch, salvo se pedirem minor/major) |
| local **menor** ou os 4 arquivos divergindo | realinhe com `npm run versao <alvo>` |

**Diga o número escolhido para a usuária e espere o "pode ir"** antes do passo 4.

## 2. Subir a versão

```bash
npm run versao 1.1.0
```

Escreve a versão nos quatro arquivos de uma vez (`package.json` da raiz,
`apps/desktop/package.json`, `apps/mobile/package.json`, `apps/mobile/app.json`).
Rode mesmo que o alvo já seja a versão local — é idempotente e realinha quem
tiver ficado para trás. Nunca edite os arquivos na mão: instalador e APK sairiam
com números diferentes dentro da mesma release.

## 3. Conferir que compila

```bash
npm run typecheck
```

Erro aqui **para a publicação**. Conserte (ou avise) antes de seguir; não
publique uma versão que não passa no typecheck.

## 4. Comitar tudo e dar push

Tudo que estiver pendente entra — o push precisa vir **antes** da release, senão
a tag aponta para um commit que ninguém tem.

```bash
git add -A
git commit    # mensagem em pt-BR, corpo explicando o porquê, trailers do Claude Code
git push
```

Mensagem no padrão do repositório: primeira linha no imperativo dizendo o que
mudou e a versão (ex.: `Sobe para 1.1.0 e publica o instalador`), corpo em
tópicos com o motivo de cada mudança relevante.

## 5. Build + publicação

```bash
GH_TOKEN=$(gh auth token) npm run desktop:release
```

**Rode em background** — são vários minutos (electron-vite + NSIS + upload de
~83 MB). Espere a notificação, não fique fazendo poll.

Isso faz `electron-vite build` e depois `electron-builder --publish always`, que
sobe o instalador, o `.blockmap` e o `latest.yml` para a release `v1.1.0`.

**Se a release da versão já existir** (a skill `publicar-apk` pode tê-la criado
com o APK), o electron-builder anexa os arquivos na release existente — é o
comportamento esperado, não crie outra. Se ele reclamar da release já publicada,
use o caminho manual:

```bash
npm run desktop:package
cd apps/desktop && gh release upload v1.1.0 \
  "release/PlannerFofo-1.1.0-setup.exe" \
  "release/PlannerFofo-1.1.0-setup.exe.blockmap" \
  "release/latest.yml" --clobber
```

## 6. Conferir a release

Uma release **só atualiza os apps instalados se tiver os três arquivos**:

```bash
gh release view v1.1.0 --json assets --jq '.assets[].name'
```

Tem que aparecer `PlannerFofo-1.1.0-setup.exe`, `...exe.blockmap` e
`latest.yml`. Se houver um `.apk` junto, ótimo — é a release compartilhada com
o mobile; não apague nada dela.

## 7. Título e notas

O electron-builder cria a release sem título nem descrição. Ajuste no padrão do
repositório (`Planner Fofo 1.0.0 🌸`):

```bash
git log --oneline v1.0.0..v1.1.0        # base para as notas
gh release edit v1.1.0 --title "Planner Fofo 1.1.0 🌸" --notes-file <arquivo>
```

Notas em pt-BR, do ponto de vista de quem usa o app (o que mudou na tela), não
lista de commits. Se a release já tiver notas do APK, **edite somando** — não
sobrescreva o que já está lá.

## Armadilhas que já custaram tempo

- **`electron` fica com versão presa** (sem `^`) em `apps/desktop/package.json`.
  Com faixa, o electron-builder falha com "Cannot compute electron version",
  porque ele roda em `apps/desktop` e o `electron` está hoisted na raiz.
- **`artifactName` sem espaço.** O GitHub troca espaço por ponto no nome do
  asset e o `latest.yml` deixa de casar com a URL de download.
- **NSIS `perMachine: false`**, senão a atualização automática pede UAC.
- **Só existe atualização automática no desktop.** O mobile não tem
  `expo-updates` de propósito — não instale "só para testar".
- **Publicou versão errada?** Não dá para "despublicar" com segurança: suba uma
  versão nova e corrija. `gh release delete` só se ninguém tiver baixado ainda,
  e sempre perguntando antes.

## Ao terminar

Diga a versão publicada, cole a URL da release e liste os assets que ficaram
nela. Se parou no meio, diga em qual passo e se o commit/push já foi (isso muda
o que precisa ser feito na retomada). Para anexar o APK na mesma release, é a
skill `publicar-apk`.
