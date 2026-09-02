/** Cartão de hábito fixo do desktop, com as barrinhas da semana. */
import React from 'react';
import {
  CORES,
  DIAS,
  DIAS_LONGOS,
  contadorDaSemana,
  paleta,
  type HabitoDaSemana,
} from '@planner-fofo/shared';

export function CartaoHabito({
  habito,
  indiceSelecionado,
  indiceMaximo,
  aoAlternar,
  aoAlternarDia,
  aoEditar,
}: {
  habito: HabitoDaSemana;
  indiceSelecionado: number;
  indiceMaximo: number;
  aoAlternar: () => void;
  aoAlternarDia: (dia: number) => void;
  aoEditar: () => void;
}) {
  const p = paleta(habito.cor);
  const feito = habito.semana[indiceSelecionado];

  return (
    <div className="habito" style={{ background: p.bg, borderColor: p.borda }}>
      <div className="habito__linha">
        <div className="habito__emoji">{habito.emoji}</div>

        <div className="habito__textos">
          <span className="habito__nome" style={{ color: p.texto }}>
            {habito.nome}
          </span>
          <span className="habito__contador" style={{ color: p.suave }}>
            {contadorDaSemana(habito)}
          </span>
        </div>

        <button
          type="button"
          className="habito__editar"
          style={{ color: p.suave }}
          onClick={aoEditar}
          aria-label={`Editar ${habito.nome}`}
        >
          ✎
        </button>

        <button
          type="button"
          className="habito__check"
          role="checkbox"
          aria-checked={feito}
          aria-label={habito.nome}
          onClick={aoAlternar}
          style={{ borderColor: p.borda, background: feito ? p.forte : '#ffffff' }}
        >
          {feito ? '✓' : ''}
        </button>
      </div>

      {/* Cada barrinha marca o proprio dia — e por aqui que se conserta um
          habito esquecido. Dia no futuro fica desligado. */}
      <div className="habito__semana">
        {DIAS.map((rotulo, i) => {
          const agendado = habito.agenda[i];
          const marcado = habito.semana[i];
          const futuro = i > indiceMaximo;
          return (
            <button
              key={i}
              type="button"
              className="habito__dia"
              disabled={futuro}
              onClick={() => aoAlternarDia(i)}
              aria-pressed={marcado}
              aria-label={`${habito.nome} em ${DIAS_LONGOS[i]}`}
            >
              <div
                className="habito__dia-barra"
                style={{
                  background: marcado
                    ? p.forte
                    : agendado
                      ? i === indiceSelecionado
                        ? p.borda
                        : CORES.diaInativo
                      : CORES.diaVazio,
                }}
              />
              <span
                className="habito__dia-rotulo"
                style={{
                  color: !agendado
                    ? CORES.diaRotuloOff
                    : i === indiceSelecionado
                      ? p.texto
                      : CORES.diaRotuloNeutro,
                }}
              >
                {rotulo}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
