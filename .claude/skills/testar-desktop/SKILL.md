---
name: testar-desktop
description: Testa o app desktop (Electron + React + Vite) do Planner Fofo — typecheck, build e execução da janela. Use quando pedirem para rodar, testar, abrir o app desktop, validar uma mudança nele, ou investigar por que a janela não abre / fica em branco.
---

# Testar o Planner Fofo no desktop

Valida o app Electron do mais barato ao mais caro: backend, tipos, build e só
então a janela. Trabalhe a partir da raiz do monorepo, `D:\Projetos\planner-fofo`.

---

## 1. Ambiente

```bash
node scripts/checar-supabase.mjs
```

Tem que sair `Backend de pé. 💗`. Se falhar, é problema de banco ou de `.env` —
resolva antes, senão o app só vai mostrar a tela "Falta configurar o Supabase".

A última linha, `info cadastro`, diz se a confirmação de e-mail está ligada — leia antes de tentar criar conta no passo 5.

O renderer lê `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Duas pegadinhas:

- O `.env` fica na **raiz do monorepo**, não em `apps/desktop`. Quem aponta para
  lá é o `envDir` no `electron.vite.config.ts`.
- O Vite injeta as variáveis no build. Mexeu no `.env`? Reinicie o dev server.

## 2. Tipos

```bash
npm run typecheck --workspace @planner-fofo/desktop
```

São dois projetos: `tsconfig.web.json` (renderer + `packages/shared`) e
`tsconfig.node.json` (processo principal e preload). O script roda os dois.

## 3. Build

```bash
npm run desktop:build
```

Produz `apps/desktop/out/` com `main/`, `preload/` e `renderer/`. Um build
saudável hoje transforma ~98 módulos e gera ~26 KB de CSS e ~1,3 MB de JS.

Este passo pega erro de import, de alias e de CSS sem precisar abrir janela —
rode sempre antes do passo 4.

## 4. Rodar

```bash
npm run desktop
```

Sobe o `electron-vite dev`: Vite com HMR no renderer e Electron recarregando o
processo principal. A janela abre em 1280×860 com fundo `#fce7f3` (não deve
haver flash branco — o `backgroundColor` e o `ready-to-show` cuidam disso).

Rode em background: o comando fica preso no dev server.

Para o instalador (só quando pedirem empacotamento):

```bash
npm run package --workspace @planner-fofo/desktop
```

## 5. Fluxos a exercitar

Sem sessão o app abre no login. Crie uma conta de teste — o gatilho
`ao_criar_usuaria` popula 5 hábitos e 8 tags, então as telas nascem cheias.

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

- **Barra lateral** — navegar entre as quatro seções; o item ativo fica com
  fundo rosa. O cartão de sequência mostra o mesmo número que a aba Gráficos.
  "sair da conta" encerra a sessão e volta ao login.
- **Hoje** — o anel usa `conic-gradient` de verdade aqui. Marcar um hábito
  preenche o círculo e move a barra na hora. Fechar o dia dispara o confete.
  A grade de hábitos reflui entre 320px e a largura disponível.
- **Estudos / Avulsas** — Hoje/Histórico, chips de tag no Histórico, painel de
  porcentagem ao filtrar. Criar item pelo botão do cabeçalho; `Enter` no campo
  de texto salva; `Esc` fecha o modal. Criar e apagar tag por "editar tags".
- **Gráficos** — trocar Semana/Mês/Ano refaz o gráfico; abaixo de 1100px a
  grade de dois painéis vira uma coluna só.

Redimensione a janela até o mínimo (960×680) e confirme que nada estoura na
horizontal.

## 6. Logs quando algo quebra

- **Renderer** — abra o DevTools na janela (`Ctrl+Shift+I`). O `usePlanner` manda
  erro de rede/RLS para `console.warn` com o prefixo `[Planner Fofo]`.
- **Processo principal** — sai no terminal onde `npm run desktop` está rodando.

Falhas comuns:

- **Janela em branco** → quase sempre erro de JS no renderer. Olhe o DevTools
  antes de mexer em qualquer outra coisa.
- **Fontes no tipo do sistema** → a CSP do `index.html` precisa liberar
  `fonts.googleapis.com` (style-src) e `fonts.gstatic.com` (font-src).
- **Erro de conexão com o Supabase** → a CSP precisa de `https://*.supabase.co`
  e `wss://*.supabase.co` em `connect-src`.
- **`@planner-fofo/shared` não resolve** → confira o alias e o `server.fs.allow`
  no `electron.vite.config.ts`; ambos apontam para a raiz do monorepo.

## Ao terminar

Reporte o que passou, o que falhou com a saída literal do erro e qual arquivo
provavelmente causa. Se a janela abriu mas ficou branca, cole o erro do DevTools
— não descreva de memória.
