/** Modal de novo/editar hábito fixo. */
import React, { useEffect } from 'react';
import {
  CORES_HABITO,
  DIAS,
  EMOJIS_HABITO,
  PALETAS,
  resumoAgenda,
  type PlannerStore,
} from '@planner-fofo/shared';

export function ModalHabito({ planner }: { planner: PlannerStore }) {
  const { rascunho } = planner;

  // Esc fecha o modal, como se espera de uma app desktop.
  useEffect(() => {
    if (!rascunho) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') planner.fecharRascunho();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [rascunho, planner]);

  if (!rascunho) return null;

  return (
    <div
      className="fundo-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) planner.fecharRascunho();
      }}
    >
      <div className="modal" role="dialog" aria-modal aria-label="Editar hábito">
        <div className="modal__cabecalho">
          <span className="modal__titulo">
            {rascunho.id ? 'Editar hábito' : 'Novo hábito fixo'}
          </span>
          <button
            type="button"
            className="modal__fechar"
            onClick={planner.fecharRascunho}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <label className="campo">
          <span className="campo__rotulo">Nome do hábito</span>
          <input
            className="campo__input"
            value={rascunho.nome}
            autoFocus
            onChange={(e) => planner.mudarRascunho({ nome: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void planner.salvarRascunho();
            }}
            placeholder="Ex: Tomar 2L de água"
          />
        </label>

        <div className="campo">
          <span className="campo__rotulo">Iconezinho</span>
          <div className="emojis">
            {EMOJIS_HABITO.map((emoji) => {
              const ativo = rascunho.emoji === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  className="emoji-botao"
                  onClick={() => planner.mudarRascunho({ emoji })}
                  style={{
                    background: ativo ? '#fff0f8' : '#fffafd',
                    borderColor: ativo ? '#f2a8d5' : '#f6e6f0',
                  }}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <div className="campo">
          <span className="campo__rotulo">Cor</span>
          <div className="cores">
            {CORES_HABITO.map((chave) => (
              <button
                key={chave}
                type="button"
                className="cor-botao"
                aria-label={`Cor ${chave}`}
                onClick={() => planner.mudarRascunho({ cor: chave })}
                style={{
                  background: PALETAS[chave].forte,
                  borderColor: rascunho.cor === chave ? '#6b4278' : '#ffffff',
                  boxShadow: '0 6px 12px -8px rgba(120,60,140,0.8)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="campo">
          <span className="campo__rotulo">Dias da semana</span>
          <div className="dias">
            {DIAS.map((rotulo, i) => (
              <button
                key={i}
                type="button"
                className={`dia-botao ${
                  rascunho.agenda[i] ? 'dia-botao--ativo' : 'dia-botao--inativo'
                }`}
                aria-pressed={rascunho.agenda[i]}
                onClick={() => planner.alternarDiaDoRascunho(i)}
              >
                {rotulo}
              </button>
            ))}
          </div>
          <span className="campo__apoio">{resumoAgenda(rascunho.agenda)}</span>
        </div>

        <div className="modal__acoes">
          {rascunho.id ? (
            <button
              type="button"
              className="botao-excluir"
              onClick={() => void planner.excluirDoRascunho()}
            >
              Excluir
            </button>
          ) : null}
          <button
            type="button"
            className="botao-salvar"
            onClick={() => void planner.salvarRascunho()}
          >
            Salvar hábito 💗
          </button>
        </div>
      </div>
    </div>
  );
}
