/** Modal de novo item / edição das listas de Estudos / Avulsas. */
import React, { useEffect, useState } from 'react';
import {
  CHAVES_PALETA,
  PALETAS,
  diasAtras,
  hoje,
  paleta,
  rotuloData,
  textosDaLista,
  type ChavePaleta,
  type PlannerStore,
} from '@planner-fofo/shared';
import { Chip } from './Base';

const ATALHOS = [
  { nome: 'Ontem', off: 1 },
  { nome: 'Hoje', off: 0 },
  { nome: 'Amanhã', off: -1 },
];

export function ModalItem({ planner }: { planner: PlannerStore }) {
  const { rascunhoItem, estadoLista } = planner;

  const [gerenciando, setGerenciando] = useState(false);
  const [criando, setCriando] = useState(false);
  const [nomeTag, setNomeTag] = useState('');
  const [corTag, setCorTag] = useState<ChavePaleta>('lilas');

  const fechar = () => {
    setGerenciando(false);
    setCriando(false);
    setNomeTag('');
    planner.fecharRascunhoItem();
  };

  useEffect(() => {
    if (!rascunhoItem) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
    // `fechar` é estável o bastante: só depende de setters e do planner.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rascunhoItem]);

  if (!rascunhoItem) return null;

  const textos = textosDaLista(rascunhoItem.lista === 'estudos');
  const editando = Boolean(rascunhoItem.id);
  const titulo = editando ? textos.tituloModalEdicao : textos.tituloModal;

  return (
    <div
      className="fundo-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div className="modal modal--item" role="dialog" aria-modal aria-label={titulo}>
        <div className="modal__cabecalho">
          <span className="modal__titulo">{titulo}</span>
          <button type="button" className="modal__fechar" onClick={fechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <label className="campo">
          <span className="campo__rotulo">{textos.rotuloCampo}</span>
          <input
            className="campo__input"
            value={rascunhoItem.texto}
            autoFocus
            onChange={(e) => planner.mudarRascunhoItem({ texto: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void planner.salvarItem();
            }}
            placeholder={textos.placeholder}
          />
        </label>

        <div className="campo">
          <span className="campo__rotulo">Dia</span>
          <div className="atalhos-data">
            {ATALHOS.map((atalho) => {
              const ativo = rascunhoItem.data === diasAtras(atalho.off);
              return (
                <button
                  key={atalho.nome}
                  type="button"
                  className={`atalho-data ${ativo ? 'dia-botao--ativo' : 'dia-botao--inativo'}`}
                  onClick={() => planner.mudarRascunhoItem({ data: diasAtras(atalho.off) })}
                >
                  {atalho.nome}
                </button>
              );
            })}
            <input
              type="date"
              className="campo__input entrada-data"
              value={rascunhoItem.data}
              onChange={(e) => {
                if (e.target.value) planner.mudarRascunhoItem({ data: e.target.value });
              }}
            />
          </div>
          <span className="campo__apoio">
            {rascunhoItem.data === hoje()
              ? 'Entra na lista de hoje 🌸'
              : `Vai para ${rotuloData(rascunhoItem.data).toLowerCase()} · veja em Histórico`}
          </span>
        </div>

        <div className="campo">
          <span className="campo__rotulo">{textos.rotuloTags}</span>
          <div className="chips">
            {estadoLista.tags.map((tag) => {
              const p = paleta(tag.cor);
              const ativo = rascunhoItem.tagId === tag.id;
              return (
                <Chip
                  key={tag.id}
                  rotulo={tag.nome}
                  ponto={p.forte}
                  aoTocar={() => planner.mudarRascunhoItem({ tagId: tag.id })}
                  fundo={ativo ? p.bg : '#fffafd'}
                  borda={ativo ? p.borda : '#f1e7f3'}
                  cor={ativo ? p.texto : '#bfa3ca'}
                >
                  {gerenciando ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className="tag-excluir"
                      aria-label={`Excluir tag ${tag.nome}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void planner.excluirTag(tag.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void planner.excluirTag(tag.id);
                      }}
                    >
                      ✕
                    </span>
                  ) : null}
                </Chip>
              );
            })}

            <button type="button" className="tag-nova" onClick={() => setCriando((v) => !v)}>
              {criando ? 'cancelar' : '+ nova tag'}
            </button>
            <button type="button" className="tag-link" onClick={() => setGerenciando((v) => !v)}>
              {gerenciando ? 'pronto' : 'editar tags'}
            </button>
          </div>
        </div>

        {criando ? (
          <div className="painel-nova-tag">
            <input
              className="campo__input"
              style={{ background: '#fff' }}
              value={nomeTag}
              onChange={(e) => setNomeTag(e.target.value)}
              placeholder="Nome da tag (ex: Estatística)"
            />
            <div className="cores">
              {CHAVES_PALETA.map((chave) => (
                <button
                  key={chave}
                  type="button"
                  className="cor-botao cor-botao--pequeno"
                  aria-label={`Cor ${chave}`}
                  onClick={() => setCorTag(chave)}
                  style={{
                    background: PALETAS[chave].forte,
                    borderColor: corTag === chave ? '#6b4278' : '#ffffff',
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="botao-criar-tag"
              onClick={async () => {
                await planner.criarTag(nomeTag, corTag);
                setNomeTag('');
                setCriando(false);
              }}
            >
              Criar tag 🎀
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="botao-salvar"
          onClick={() => void planner.salvarItem()}
        >
          {editando ? textos.rotuloSalvarEdicao : textos.rotuloSalvar}
        </button>
        <span className="nota">isso não entra na porcentagem do dia 💗</span>
      </div>
    </div>
  );
}
