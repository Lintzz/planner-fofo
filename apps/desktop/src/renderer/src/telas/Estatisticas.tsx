/** Seção "Suas conquistas" do desktop. */
import React, { useMemo } from 'react';
import {
  CORES,
  MESES,
  corDaBarra,
  deIso,
  gapDasBarras,
  hoje,
  montarConquistas,
  paleta,
  tituloDoGrafico,
  type PlannerStore,
  type Periodo,
} from '@planner-fofo/shared';
import { Segmentado } from '../componentes/Base';

const PERIODOS: readonly Periodo[] = ['Semana', 'Mês', 'Ano'] as const;

export function Estatisticas({ planner }: { planner: PlannerStore }) {
  const { estatisticas, periodo, habitos } = planner;

  const conquistas = useMemo(() => {
    if (!estatisticas) return [];
    return montarConquistas({
      streak: estatisticas.streak,
      totalConclusoes: estatisticas.contadores.totalConclusoes,
      diasComRegistro: estatisticas.contadores.diasComRegistro,
      diasCompletos: estatisticas.contadores.diasCompletos,
      mediaMes: estatisticas.mediaMes,
      mediaAno: estatisticas.mediaAno,
    });
  }, [estatisticas]);

  if (!estatisticas) {
    return <div className="carregando">Somando suas conquistas…</div>;
  }

  const mesAtual = MESES[deIso(hoje()).getMonth()];

  return (
    <div className="secao" style={{ gap: 20 }}>
      <div className="stats-topo">
        <Segmentado opcoes={PERIODOS} valor={periodo} aoTrocar={planner.setPeriodo} />

        <div className="stats-numeros">
          <div className="stat stat--streak">
            <span style={{ fontSize: 20 }}>🔥</span>
            <span className="stat__valor" style={{ color: CORES.rosaForte }}>
              {estatisticas.streak}
            </span>
            <span className="stat__rotulo" style={{ color: CORES.rosaSuave }}>
              dias seguidos
            </span>
          </div>

          <div className="stat stat--media">
            <span style={{ fontSize: 20 }}>💜</span>
            <span className="stat__valor" style={{ color: CORES.roxoForte }}>
              {estatisticas.media}%
            </span>
            <span className="stat__rotulo" style={{ color: CORES.roxoMedio }}>
              média {periodo.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="cartao">
        <span className="cartao__titulo">{tituloDoGrafico(periodo, mesAtual)}</span>
        <div className="grafico" style={{ gap: gapDasBarras(periodo) }}>
          {estatisticas.barras.map((barra, i) => {
            const { cores, solido } = corDaBarra(barra.valor);
            const fundo = solido ?? `linear-gradient(180deg, ${cores[0]}, ${cores[1]})`;
            return (
              <div key={`${barra.rotulo}-${i}`} className="grafico__coluna">
                <span className="grafico__valor">{barra.valor > 0 ? `${barra.valor}%` : ''}</span>
                <div className="grafico__trilha">
                  <div
                    className="grafico__barra"
                    style={{ height: `${Math.max(4, barra.valor)}%`, background: fundo }}
                  />
                </div>
                <span className="grafico__rotulo">{barra.rotulo}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stats-grade">
        <div className="painel">
          <span className="painel__titulo">
            Consistência por hábito · {periodo.toLowerCase()}
          </span>
          {estatisticas.consistencia.map((linha) => {
            const habito = habitos.find((h) => h.id === linha.habitoId);
            if (!habito) return null;
            const p = paleta(habito.cor);
            return (
              <div key={linha.habitoId} className="consistencia">
                <div className="consistencia__linha">
                  <span style={{ fontSize: 15 }}>{habito.emoji}</span>
                  <span className="consistencia__nome">
                    {habito.nome} · {Math.min(linha.feitos, linha.meta)}/{linha.meta} dias
                  </span>
                  <span className="consistencia__pct" style={{ color: p.texto }}>
                    {linha.pct}%
                  </span>
                </div>
                <div className="consistencia__trilha">
                  <div
                    className="consistencia__barra"
                    style={{ width: `${linha.pct}%`, background: p.forte }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="painel painel--conquistas">
          <span className="painel__titulo">Conquistas fofas</span>
          <div className="medalhas">
            {conquistas.map((c, i) => (
              <div
                key={`${c.nome}-${i}`}
                className="medalha"
                style={{
                  opacity: c.conquistada ? 1 : 0.45,
                  background: c.conquistada ? '#ffffff' : '#faf5fb',
                  borderColor: c.conquistada ? '#f7d9ee' : '#efe5f0',
                }}
              >
                <span className="medalha__emoji">{c.emoji}</span>
                <span className="medalha__nome">{c.nome}</span>
                <span className="medalha__dica">{c.dica}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
