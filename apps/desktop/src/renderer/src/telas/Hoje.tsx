/** Seção "Seu dia" do desktop. */
import React, { useMemo } from 'react';
import {
  hoje,
  mensagemDoDia,
  ordenarParaHoje,
  resumoDeHoje,
  rotuloData,
  somarDias,
  type PlannerStore,
} from '@planner-fofo/shared';
import { Anel } from '../componentes/Base';
import { CartaoHabito } from '../componentes/CartaoHabito';

export function Hoje({ planner }: { planner: PlannerStore }) {
  const { habitos, pct, indice, indiceMaximo, perfil, dataSelecionada, ehHoje } = planner;
  const rotulo = rotuloData(dataSelecionada);

  // Os hábitos de hoje ficam no topo; os de outros dias seguem abaixo.
  const emOrdem = useMemo(() => ordenarParaHoje(habitos, indice), [habitos, indice]);

  return (
    <div className="secao">
      {/* Faixa de dia: e por ela que se volta para ontem e marca o que ficou
          esquecido. Nao passa de hoje. */}
      <div className="faixa-dia">
        <button
          type="button"
          className="faixa-dia__seta"
          onClick={() => planner.irParaDia(somarDias(dataSelecionada, -1))}
          aria-label="Dia anterior"
        >
          ‹
        </button>

        <span className="faixa-dia__rotulo">{rotulo}</span>

        <button
          type="button"
          className="faixa-dia__seta"
          onClick={() => planner.irParaDia(somarDias(dataSelecionada, 1))}
          disabled={ehHoje}
          aria-label="Próximo dia"
        >
          ›
        </button>

        <input
          type="date"
          className="campo__input entrada-data faixa-dia__data"
          value={dataSelecionada}
          max={hoje()}
          onChange={(e) => {
            if (e.target.value) planner.irParaDia(e.target.value);
          }}
        />

        {!ehHoje ? (
          <button
            type="button"
            className="faixa-dia__hoje"
            onClick={() => planner.irParaDia(hoje())}
          >
            voltar pra hoje
          </button>
        ) : null}
      </div>

      <div className="heroi">
        <div className="heroi__bolha" />
        <Anel
          pct={pct}
          acento={perfil?.acento ?? '#c98af0'}
          circular={perfil?.progressoCircular ?? true}
        />
        <div className="heroi__textos">
          <span className="heroi__mensagem">{mensagemDoDia(pct)}</span>
          <span className="heroi__resumo">
            {resumoDeHoje(habitos, indice, rotulo.toLowerCase())}
          </span>
          <div className="heroi__trilha">
            <div className="heroi__barra" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="subtitulo-secao">
        <h2>Meus hábitos fixos</h2>
        <span>clique no círculo pra marcar · nas barrinhas pra outro dia</span>
      </div>

      <div className="grade-habitos">
        {emOrdem.map((habito) => (
          <CartaoHabito
            key={habito.id}
            habito={habito}
            indiceSelecionado={indice}
            indiceMaximo={indiceMaximo}
            aoAlternar={() => void planner.alternarHabito(habito.id)}
            aoAlternarDia={(dia) => void planner.alternarHabitoNoDia(habito.id, dia)}
            aoEditar={() => planner.abrirEdicaoHabito(habito.id)}
          />
        ))}
      </div>
    </div>
  );
}
