/** Seção "Seu dia" do desktop. */
import React, { useMemo } from 'react';
import {
  mensagemDoDia,
  ordenarParaHoje,
  resumoDeHoje,
  type PlannerStore,
} from '@planner-fofo/shared';
import { Anel } from '../componentes/Base';
import { CartaoHabito } from '../componentes/CartaoHabito';

export function Hoje({ planner }: { planner: PlannerStore }) {
  const { habitos, pct, indice, perfil } = planner;

  // Os hábitos de hoje ficam no topo; os de outros dias seguem abaixo.
  const emOrdem = useMemo(() => ordenarParaHoje(habitos, indice), [habitos, indice]);

  return (
    <div className="secao">
      <div className="heroi">
        <div className="heroi__bolha" />
        <Anel
          pct={pct}
          acento={perfil?.acento ?? '#c98af0'}
          circular={perfil?.progressoCircular ?? true}
        />
        <div className="heroi__textos">
          <span className="heroi__mensagem">{mensagemDoDia(pct)}</span>
          <span className="heroi__resumo">{resumoDeHoje(habitos, indice)}</span>
          <div className="heroi__trilha">
            <div className="heroi__barra" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="subtitulo-secao">
        <h2>Meus hábitos fixos</h2>
        <span>clique no círculo pra marcar</span>
      </div>

      <div className="grade-habitos">
        {emOrdem.map((habito) => (
          <CartaoHabito
            key={habito.id}
            habito={habito}
            indiceHoje={indice}
            aoAlternar={() => void planner.alternarHabito(habito.id)}
            aoEditar={() => planner.abrirEdicaoHabito(habito.id)}
          />
        ))}
      </div>
    </div>
  );
}
