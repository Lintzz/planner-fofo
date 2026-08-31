/**
 * Planner Fofo — app desktop.
 *
 * A moldura segue o artboard "Planner Fofo Web.dc.html": barra lateral fixa de
 * 268px com marca, navegação, sequência e perfil; à direita o conteúdo com o
 * cabeçalho grande e a ação principal.
 */
import React, { useEffect } from 'react';
import {
  ambienteConfigurado,
  sair,
  saudacao,
  textosDaLista,
  tituloDaAba,
  usePlanner,
  type Aba,
} from '@planner-fofo/shared';

import { supabase } from './lib/supabase';
import { Confete } from './componentes/Confete';
import { ModalHabito } from './componentes/ModalHabito';
import { ModalItem } from './componentes/ModalItem';
import { Hoje } from './telas/Hoje';
import { Lista } from './telas/Lista';
import { Estatisticas } from './telas/Estatisticas';
import { Login } from './telas/Login';

const ABAS: { k: Aba; nome: string; emoji: string }[] = [
  { k: 'hoje', nome: 'Hoje', emoji: '🌸' },
  { k: 'estudos', nome: 'Estudos', emoji: '📖' },
  { k: 'tarefas', nome: 'Avulsas', emoji: '🫧' },
  { k: 'stats', nome: 'Gráficos', emoji: '📈' },
];

export function App() {
  // Sem URL/chave o cliente nem chega a ser criado.
  if (!ambienteConfigurado()) return <SemAmbiente />;
  return <Conteudo />;
}

function Conteudo() {
  const planner = usePlanner(supabase);
  const { aba, sessao, autenticando, carregando, erro } = planner;

  useEffect(() => {
    if (erro) console.warn('[Planner Fofo]', erro);
  }, [erro]);

  if (autenticando) return <div className="centro">Um instante…</div>;
  if (!sessao) return <Login />;

  const ehLista = aba === 'estudos' || aba === 'tarefas';

  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <div className="marca__logo">🌸</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="marca__nome">Planner Fofo</span>
            <span className="marca__slogan">rotina leve e coloridinha</span>
          </div>
        </div>

        <nav className="nav">
          {ABAS.map((item) => (
            <button
              key={item.k}
              type="button"
              onClick={() => planner.setAba(item.k)}
              aria-current={aba === item.k ? 'page' : undefined}
              className={`nav__item${aba === item.k ? ' nav__item--ativo' : ''}`}
            >
              <span className="nav__emoji">{item.emoji}</span>
              <span className="nav__rotulo">{item.nome}</span>
            </button>
          ))}
        </nav>

        <div className="streak">
          <span className="streak__emoji">🔥</span>
          <span className="streak__valor">{planner.streak} dias</span>
          <span className="streak__texto">de sequência mantendo a rotina 💜</span>
        </div>

        <button type="button" className="novo-habito" onClick={planner.abrirNovoHabito}>
          <span style={{ fontSize: 16 }}>+</span>
          <span>Novo hábito fixo</span>
        </button>

        <div className="usuaria">
          <div className="usuaria__avatar">🌷</div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="usuaria__nome">{planner.perfil?.nome ?? 'Manu'}</span>
            <button
              type="button"
              className="usuaria__plano"
              onClick={() => void sair(supabase)}
              title="Encerrar a sessão"
            >
              sair da conta
            </button>
          </div>
        </div>
      </aside>

      <main className="conteudo">
        <header className="cabecalho">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="cabecalho__saudacao">
              {saudacao(planner.perfil?.nome ?? 'Manu')}
            </span>
            <h1 className="cabecalho__titulo">{tituloDaAba(aba)}</h1>
          </div>

          {ehLista ? (
            <button type="button" className="botao-primario" onClick={planner.abrirNovoItem}>
              <span className="botao-primario__icone">+</span>
              <span>{textosDaLista(aba === 'estudos').rotuloBotao}</span>
            </button>
          ) : null}
        </header>

        {carregando ? (
          <div className="carregando">Arrumando suas coisinhas…</div>
        ) : aba === 'hoje' ? (
          <Hoje planner={planner} />
        ) : ehLista ? (
          <Lista planner={planner} />
        ) : (
          <Estatisticas planner={planner} />
        )}
      </main>

      <ModalHabito planner={planner} />
      <ModalItem planner={planner} />
      <Confete visivel={planner.comemorando} />
    </div>
  );
}

function SemAmbiente() {
  return (
    <div className="centro">
      <div className="aviso-ambiente">
        <span style={{ fontSize: 40 }}>🌸</span>
        <h1>Falta configurar o Supabase</h1>
        <p>
          Copie <code>.env.example</code> para <code>.env</code> na raiz do monorepo e preencha{' '}
          <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>. Depois rode{' '}
          <code>npm run desktop</code> de novo.
        </p>
      </div>
    </div>
  );
}
