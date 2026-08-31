-- ===========================================================================
-- Planner Fofo — schema inicial
--
-- Modelo de dados do planner: habitos fixos (que contam para a porcentagem do
-- dia e para as estatisticas) e duas listas leves — Estudos e Avulsas — que,
-- por decisao de produto do design, NAO entram na porcentagem nem nos graficos.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

-- Paletas do design. O app resolve cada chave em bg/borda/texto/suave/forte.
create type public.paleta as enum (
  'rosa', 'lilas', 'roxo', 'menta', 'pessego', 'ceu', 'amarelo'
);

-- As duas listas sem pressao. Sao fixas no produto, por isso enum e nao tabela.
create type public.lista_tipo as enum ('estudos', 'tarefas');

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------

create table public.perfis (
  id                  uuid primary key references auth.users (id) on delete cascade,
  nome                text        not null default 'Manu',
  -- Cor do anel de progresso (prop `acento` do design).
  acento              text        not null default '#c98af0',
  -- Anel circular vs. faixa lisa (prop `progressoCircular`).
  progresso_circular  boolean     not null default true,
  -- Confete ao bater 100% do dia (prop `comemoracao`).
  comemoracao         boolean     not null default true,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),

  constraint perfis_nome_nao_vazio check (char_length(btrim(nome)) between 1 and 40),
  constraint perfis_acento_hex check (acento ~* '^#[0-9a-f]{6}$')
);

comment on table public.perfis is
  'Preferencias da usuaria. Uma linha por conta, criada automaticamente no signup.';

-- ---------------------------------------------------------------------------
-- Habitos fixos
-- ---------------------------------------------------------------------------

create table public.habitos (
  id            uuid          primary key default gen_random_uuid(),
  usuario_id    uuid          not null references auth.users (id) on delete cascade,
  nome          text          not null,
  emoji         text          not null default '🌷',
  cor           public.paleta not null default 'rosa',
  -- Agenda semanal, indice 1 = segunda ... 7 = domingo (casa com `isodow`).
  agenda        boolean[]     not null default array[true, true, true, true, true, true, true],
  ordem         integer       not null default 0,
  arquivado     boolean       not null default false,
  criado_em     timestamptz   not null default now(),
  atualizado_em timestamptz   not null default now(),

  constraint habitos_nome_nao_vazio check (char_length(btrim(nome)) between 1 and 80),
  constraint habitos_agenda_sete_dias check (array_length(agenda, 1) = 7),
  -- Agenda vazia nao faz sentido: o app converte "nenhum dia" em "todos os dias".
  constraint habitos_agenda_nao_vazia check (true = any (agenda))
);

comment on column public.habitos.agenda is
  'Dias da semana em que o habito e cobrado. Indice 1 = segunda ... 7 = domingo.';

create index habitos_usuario_idx on public.habitos (usuario_id, arquivado, ordem, criado_em);

-- ---------------------------------------------------------------------------
-- Registros de conclusao
--
-- A presenca da linha significa "feito naquele dia" — desmarcar apaga a linha.
-- Isso mantem a tabela enxuta e torna as contagens somas diretas.
-- ---------------------------------------------------------------------------

create table public.habito_registros (
  id         uuid        primary key default gen_random_uuid(),
  habito_id  uuid        not null references public.habitos (id) on delete cascade,
  usuario_id uuid        not null references auth.users (id) on delete cascade,
  data       date        not null default current_date,
  criado_em  timestamptz not null default now(),

  constraint habito_registros_unico unique (habito_id, data)
);

create index habito_registros_usuario_data_idx
  on public.habito_registros (usuario_id, data desc);

-- ---------------------------------------------------------------------------
-- Tags (materias em Estudos, categorias em Avulsas)
-- ---------------------------------------------------------------------------

create table public.tags (
  id         uuid              primary key default gen_random_uuid(),
  usuario_id uuid              not null references auth.users (id) on delete cascade,
  lista      public.lista_tipo not null,
  nome       text              not null,
  cor        public.paleta     not null default 'lilas',
  criado_em  timestamptz       not null default now(),

  constraint tags_nome_nao_vazio check (char_length(btrim(nome)) between 1 and 40)
);

-- Nomes de tag sao unicos por lista, ignorando maiusculas — o app ja compara
-- com `toLowerCase()` antes de criar.
create unique index tags_nome_unico_idx
  on public.tags (usuario_id, lista, lower(btrim(nome)));

create index tags_usuario_lista_idx on public.tags (usuario_id, lista, criado_em);

-- ---------------------------------------------------------------------------
-- Itens das listas
-- ---------------------------------------------------------------------------

create table public.itens (
  id            uuid              primary key default gen_random_uuid(),
  usuario_id    uuid              not null references auth.users (id) on delete cascade,
  lista         public.lista_tipo not null,
  texto         text              not null,
  -- Apagar uma tag nao apaga o item; ele so fica sem categoria.
  tag_id        uuid              references public.tags (id) on delete set null,
  feito         boolean           not null default false,
  data          date              not null default current_date,
  criado_em     timestamptz       not null default now(),
  atualizado_em timestamptz       not null default now(),

  constraint itens_texto_nao_vazio check (char_length(btrim(texto)) between 1 and 200)
);

create index itens_usuario_lista_data_idx
  on public.itens (usuario_id, lista, data desc, criado_em desc);

create index itens_tag_idx on public.itens (tag_id);

-- ---------------------------------------------------------------------------
-- Manutencao de `atualizado_em`
-- ---------------------------------------------------------------------------

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.atualizado_em := now();
  return new;
end;
$fn$;

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

create trigger habitos_atualizado_em
  before update on public.habitos
  for each row execute function public.tocar_atualizado_em();

create trigger itens_atualizado_em
  before update on public.itens
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------------
-- Coerencia de dono
--
-- `usuario_id` e denormalizado em habito_registros/itens para que as policies
-- de RLS sejam um teste direto, sem subconsulta. Estes gatilhos garantem que a
-- denormalizacao nao possa divergir do pai.
-- ---------------------------------------------------------------------------

create or replace function public.checar_dono_registro()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  dono uuid;
begin
  select h.usuario_id into dono from public.habitos h where h.id = new.habito_id;
  if dono is null then
    raise exception 'Habito % nao encontrado', new.habito_id;
  end if;
  if new.usuario_id is distinct from dono then
    raise exception 'Registro nao pertence a quem e dono do habito';
  end if;
  return new;
end;
$fn$;

create trigger habito_registros_dono
  before insert or update on public.habito_registros
  for each row execute function public.checar_dono_registro();

create or replace function public.checar_tag_do_item()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  dono        uuid;
  lista_da_tag public.lista_tipo;
begin
  if new.tag_id is null then
    return new;
  end if;
  select t.usuario_id, t.lista into dono, lista_da_tag
    from public.tags t where t.id = new.tag_id;
  if dono is distinct from new.usuario_id or lista_da_tag is distinct from new.lista then
    raise exception 'A tag escolhida pertence a outra usuaria ou a outra lista';
  end if;
  return new;
end;
$fn$;

create trigger itens_tag_coerente
  before insert or update on public.itens
  for each row execute function public.checar_tag_do_item();
