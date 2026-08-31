-- ===========================================================================
-- Planner Fofo — Row Level Security e onboarding
--
-- Todo dado do planner e privado da conta. As policies usam
-- `(select auth.uid())` em vez de `auth.uid()` porque assim o Postgres avalia
-- a funcao uma unica vez por query, e nao uma vez por linha.
-- ===========================================================================

alter table public.perfis            enable row level security;
alter table public.habitos           enable row level security;
alter table public.habito_registros  enable row level security;
alter table public.tags              enable row level security;
alter table public.itens             enable row level security;

-- ---------------------------------------------------------------------------
-- perfis — a usuaria le e edita apenas o proprio perfil.
-- Nao ha policy de INSERT: o perfil nasce do gatilho de signup.
-- Nao ha policy de DELETE: o perfil some junto com a conta (on delete cascade).
-- ---------------------------------------------------------------------------

create policy "perfis: ler o proprio"
  on public.perfis for select to authenticated
  using ((select auth.uid()) = id);

create policy "perfis: editar o proprio"
  on public.perfis for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- habitos
-- ---------------------------------------------------------------------------

create policy "habitos: ler os proprios"
  on public.habitos for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "habitos: criar os proprios"
  on public.habitos for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy "habitos: editar os proprios"
  on public.habitos for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy "habitos: apagar os proprios"
  on public.habitos for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- habito_registros
-- ---------------------------------------------------------------------------

create policy "registros: ler os proprios"
  on public.habito_registros for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "registros: criar os proprios"
  on public.habito_registros for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy "registros: apagar os proprios"
  on public.habito_registros for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

create policy "tags: ler as proprias"
  on public.tags for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "tags: criar as proprias"
  on public.tags for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy "tags: editar as proprias"
  on public.tags for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy "tags: apagar as proprias"
  on public.tags for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- itens
-- ---------------------------------------------------------------------------

create policy "itens: ler os proprios"
  on public.itens for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "itens: criar os proprios"
  on public.itens for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

create policy "itens: editar os proprios"
  on public.itens for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy "itens: apagar os proprios"
  on public.itens for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- Onboarding
--
-- Ao criar a conta a usuaria ja encontra o app povoado: perfil, habitos de
-- exemplo e as tags iniciais das duas listas, exatamente como no design.
--
-- Roda como `security definer` porque `auth.users` dispara o gatilho antes de
-- existir qualquer sessao — nao ha `auth.uid()` para as policies avaliarem.
-- ---------------------------------------------------------------------------

create or replace function public.preparar_conta_nova()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  apelido text;
begin
  -- Nome vem do metadata do signup; senao, da parte local do e-mail.
  apelido := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Manu'
  );

  insert into public.perfis (id, nome)
  values (new.id, left(apelido, 40))
  on conflict (id) do nothing;

  insert into public.habitos (usuario_id, nome, emoji, cor, agenda, ordem) values
    (new.id, 'Tomar 2L de água', '💧', 'lilas',
     array[true, true, true, true, true, true, true], 0),
    (new.id, 'Fazer exercício', '👟', 'rosa',
     array[true, false, true, false, true, true, false], 1),
    (new.id, 'Comer bem', '🥗', 'menta',
     array[true, true, true, true, true, true, true], 2),
    (new.id, 'Estudar', '📚', 'roxo',
     array[true, true, true, true, true, false, false], 3),
    (new.id, 'Dormir 8h', '🌙', 'pessego',
     array[true, true, true, true, true, true, false], 4);

  insert into public.tags (usuario_id, lista, nome, cor) values
    (new.id, 'estudos', 'Estatística', 'lilas'),
    (new.id, 'estudos', 'Biologia',    'menta'),
    (new.id, 'estudos', 'Cálculo',     'rosa'),
    (new.id, 'estudos', 'Redação',     'pessego'),
    (new.id, 'tarefas', 'Casa',        'menta'),
    (new.id, 'tarefas', 'Saúde',       'rosa'),
    (new.id, 'tarefas', 'Grana',       'ceu'),
    (new.id, 'tarefas', 'Outros',      'amarelo');

  return new;
end;
$fn$;

create trigger ao_criar_usuaria
  after insert on auth.users
  for each row execute function public.preparar_conta_nova();
