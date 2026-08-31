/** Peças reutilizadas pelas três seções do desktop. */
import React from 'react';

export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoTrocar,
}: {
  opcoes: readonly T[];
  valor: T;
  aoTrocar: (v: T) => void;
}) {
  return (
    <div className="segmentado" role="tablist">
      {opcoes.map((opcao) => (
        <button
          key={opcao}
          type="button"
          role="tab"
          aria-selected={opcao === valor}
          onClick={() => aoTrocar(opcao)}
          className={`segmentado__opcao${opcao === valor ? ' segmentado__opcao--ativo' : ''}`}
        >
          {opcao}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  rotulo,
  ponto,
  fundo,
  borda,
  cor,
  aoTocar,
  children,
}: {
  rotulo: string;
  ponto?: string;
  fundo: string;
  borda: string;
  cor: string;
  aoTocar: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="chip"
      onClick={aoTocar}
      style={{ background: fundo, borderColor: borda, color: cor }}
    >
      {ponto ? <span className="chip__ponto" style={{ background: ponto }} /> : null}
      {rotulo}
      {children}
    </button>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <div className="vazio">
      <span className="vazio__emoji">🌼</span>
      <span className="vazio__texto">{texto}</span>
    </div>
  );
}

export function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="campo">
      <span className="campo__rotulo">{rotulo}</span>
      {children}
    </label>
  );
}

/**
 * Anel de progresso — `conic-gradient` como no design, com o miolo branco por
 * cima. `progressoCircular: false` troca o anel pela faixa lisa.
 */
export function Anel({
  pct,
  acento,
  circular = true,
}: {
  pct: number;
  acento: string;
  circular?: boolean;
}) {
  const fundo = circular
    ? `conic-gradient(${acento} ${pct * 3.6}deg, #f6e6fa ${pct * 3.6}deg)`
    : 'linear-gradient(140deg, #ffd9ee, #e8d9fd)';

  return (
    <div className="anel" style={{ background: fundo }} role="img" aria-label={`${pct}% do dia`}>
      <div className="anel__miolo">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span className="anel__pct">{pct}%</span>
          <span className="anel__legenda">DO DIA</span>
        </div>
      </div>
    </div>
  );
}
