---
name: testar-desktop
description: Sobe o app desktop (Electron + React + Vite) do Planner Fofo com `npm run desktop` para a usuária testar na mão. Use quando pedirem para rodar, abrir ou subir o app desktop.
---

# Subir o Planner Fofo no desktop

**Quem testa é a usuária.** Esta skill só abre a janela do Electron e devolve o
controle. Não navegue pelo app, não crie conta, não exercite fluxos e não fique
redimensionando janela — a menos que peçam explicitamente.

Trabalhe a partir da raiz do monorepo, `D:\Projetos\planner-fofo`.

## 1. Rodar

```bash
npm run desktop
```

**Rode em background** — o comando fica preso no dev server.

Sobe o `electron-vite dev`: Vite com HMR no renderer e Electron recarregando o
processo principal. A janela abre em 1280×860 com fundo `#fce7f3`.

Assim que a janela abrir, avise que está no ar e pare por aí.

Empacotamento (só quando pedirem):

```bash
npm run desktop:package        # instalador local, sem publicar
```

## 2. Se não subir

- **Processo principal** → sai no terminal onde `npm run desktop` está rodando.
- **Renderer** → DevTools na janela (`Ctrl+Shift+I`). O `usePlanner` manda erro
  de rede/RLS para `console.warn` com o prefixo `[Planner Fofo]`.

Falhas comuns:

- **Janela em branco** → quase sempre erro de JS no renderer. Olhe o DevTools
  antes de mexer em qualquer outra coisa.
- **Tela "Falta configurar o Supabase"** → o `.env` mora na **raiz do
  monorepo**, não em `apps/desktop`; quem aponta para lá é o `envDir` no
  `electron.vite.config.ts`. O Vite injeta as variáveis na subida, então mexeu
  no `.env` → reinicie o dev server.
- **Fontes no tipo do sistema** → a CSP do `index.html` precisa liberar
  `fonts.googleapis.com` (style-src) e `fonts.gstatic.com` (font-src).
- **Erro de conexão com o Supabase** → a CSP precisa de `https://*.supabase.co`
  e `wss://*.supabase.co` em `connect-src`.
- **`@planner-fofo/shared` não resolve** → confira o alias e o `server.fs.allow`
  no `electron.vite.config.ts`; ambos apontam para a raiz do monorepo.

Se quiser pegar erro de import, alias ou CSS antes de abrir a janela:

```bash
npm run typecheck --workspace @planner-fofo/desktop
npm run desktop:build
```

## Ao terminar

Diga que a janela está aberta e que o teste é com ela. Se não abriu, cole a
saída literal do erro (do terminal ou do DevTools) — não descreva de memória.
