/** Comemoração de 100% do dia — mesma queda de confete do design. */
import React, { useMemo } from 'react';
import { CORES_CONFETE } from '@planner-fofo/shared';

const QUANTIDADE = 46;

export function Confete({ visivel }: { visivel: boolean }) {
  const papeis = useMemo(
    () =>
      Array.from({ length: QUANTIDADE }, (_, i) => {
        const redondo = i % 3 === 0;
        return {
          esquerda: `${(Math.random() * 96 + 2).toFixed(1)}%`,
          largura: redondo ? 9 : 7,
          altura: redondo ? 9 : 14,
          raio: redondo ? '50%' : '3px',
          cor: CORES_CONFETE[i % CORES_CONFETE.length],
          duracao: `${(2.1 + Math.random() * 1.7).toFixed(2)}s`,
          atraso: `${(Math.random() * 1.1).toFixed(2)}s`,
        };
      }),
    [],
  );

  if (!visivel) return null;

  return (
    <div className="confete" aria-hidden>
      {papeis.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: -40,
            left: p.esquerda,
            width: p.largura,
            height: p.altura,
            borderRadius: p.raio,
            background: p.cor,
            animation: `confettiFall ${p.duracao} linear ${p.atraso} forwards`,
          }}
        />
      ))}

      <div className="confete__cartao">
        <span style={{ fontSize: 34 }}>🎉</span>
        <span className="confete__titulo">100% do dia!</span>
        <span className="confete__texto">Você cuidou de você hoje. Que orgulho! 💜</span>
      </div>
    </div>
  );
}
