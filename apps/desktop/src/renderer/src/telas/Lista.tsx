/** Seções "Estudos" e "Sem pressão" do desktop. */
import React from 'react';
import {
  CORES,
  hoje,
  paleta,
  rodapeDaLista,
  textosDaLista,
  type Item,
  type PlannerStore,
  type Tag,
} from '@planner-fofo/shared';
import { Chip, Segmentado, Vazio } from '../componentes/Base';

const ESCOPOS = ['Hoje', 'Histórico'] as const;

export function Lista({ planner }: { planner: PlannerStore }) {
  const { estadoLista, itensVisiveis, grupos, tagPorId, listaAtual } = planner;
  const ehEstudos = listaAtual === 'estudos';
  const textos = textosDaLista(ehEstudos);

  const tagFiltro = estadoLista.filtroTagId ? tagPorId.get(estadoLista.filtroTagId) : undefined;
  const mostrarChips = estadoLista.escopo === 'tudo';

  return (
    <div className="secao" style={{ gap: 18 }}>
      <div className="lista-topo">
        <Segmentado
          opcoes={ESCOPOS}
          valor={estadoLista.escopo === 'hoje' ? 'Hoje' : 'Histórico'}
          aoTrocar={(v) => planner.definirEscopo(v === 'Hoje' ? 'hoje' : 'tudo')}
        />
        <span className="lista-aviso" style={{ color: ehEstudos ? '#7d4fbf' : '#7d63b8' }}>
          {textos.avisoEmoji} {textos.aviso}
        </span>
      </div>

      {mostrarChips ? (
        <div className="chips">
          <Chip
            rotulo="Todas"
            aoTocar={() => planner.definirFiltro(null)}
            fundo={tagFiltro ? '#fffafd' : CORES.chipAtivo}
            borda={tagFiltro ? '#f1e7f3' : CORES.chipBorda}
            cor={tagFiltro ? '#bfa3ca' : CORES.abaAtiva}
          />
          {estadoLista.tags.map((tag) => {
            const p = paleta(tag.cor);
            const ativo = estadoLista.filtroTagId === tag.id;
            return (
              <Chip
                key={tag.id}
                rotulo={tag.nome}
                ponto={p.forte}
                aoTocar={() => planner.definirFiltro(ativo ? null : tag.id)}
                fundo={ativo ? p.bg : '#fffafd'}
                borda={ativo ? p.borda : '#f1e7f3'}
                cor={ativo ? p.texto : '#bfa3ca'}
              />
            );
          })}
        </div>
      ) : null}

      {mostrarChips && tagFiltro ? (
        <PainelDaTag tag={tagFiltro} itens={estadoLista.itens} ehEstudos={ehEstudos} />
      ) : null}

      <div className="grupos">
        {grupos.map((grupo) => (
          <div key={grupo.data} className="grupo">
            <div className="grupo__cabecalho">
              <span className="grupo__rotulo">{grupo.rotulo}</span>
              <span className="grupo__linha" />
              <span className="grupo__contagem">{grupo.contagem}</span>
            </div>
            <div className="grupo__itens">
              {grupo.itens.map((item) => (
                <LinhaItem
                  key={item.id}
                  item={item}
                  tag={item.tagId ? tagPorId.get(item.tagId) : undefined}
                  sufixo={grupo.data === hoje() ? '' : ` · ${grupo.rotulo}`}
                  aoAlternar={() => void planner.alternarItem(item.id)}
                  aoEditar={() => planner.abrirEdicaoItem(item.id)}
                  aoRemover={() => void planner.excluirItem(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {itensVisiveis.length === 0 ? (
        <Vazio texto={estadoLista.escopo === 'hoje' ? textos.vazioHoje : textos.vazioFiltro} />
      ) : null}

      <span className="rodape-lista">
        {rodapeDaLista(itensVisiveis, estadoLista.escopo, ehEstudos)}
      </span>
    </div>
  );
}

function PainelDaTag({ tag, itens, ehEstudos }: { tag: Tag; itens: Item[]; ehEstudos: boolean }) {
  const p = paleta(tag.cor);
  const daTag = itens.filter((i) => i.tagId === tag.id);
  const feitos = daTag.filter((i) => i.feito).length;
  const pct = daTag.length ? Math.round((feitos / daTag.length) * 100) : 0;

  return (
    <div className="painel-tag" style={{ background: p.bg, borderColor: p.borda }}>
      <div className="painel-tag__pct" style={{ color: p.texto }}>
        {pct}%
      </div>
      <div>
        <div className="painel-tag__titulo" style={{ color: p.texto }}>
          {tag.nome}
        </div>
        <div className="painel-tag__resumo" style={{ color: p.texto }}>
          {daTag.length} {ehEstudos ? 'conteúdos' : 'tarefas'} · {feitos} concluídos
        </div>
      </div>
    </div>
  );
}

function LinhaItem({
  item,
  tag,
  sufixo,
  aoAlternar,
  aoEditar,
  aoRemover,
}: {
  item: Item;
  tag?: Tag;
  sufixo: string;
  aoAlternar: () => void;
  aoEditar: () => void;
  aoRemover: () => void;
}) {
  const p = paleta(tag?.cor);

  return (
    <div
      className="item"
      style={{
        background: item.feito ? CORES.feitoBg : p.bg,
        borderColor: item.feito ? CORES.feitoBorda : p.borda,
      }}
    >
      <button
        type="button"
        className="item__caixa"
        role="checkbox"
        aria-checked={item.feito}
        aria-label={item.texto}
        onClick={aoAlternar}
        style={{ borderColor: p.borda, background: item.feito ? p.forte : '#ffffff' }}
      >
        {item.feito ? '✓' : ''}
      </button>

      <div className="item__textos">
        <span
          className="item__texto"
          style={{
            color: item.feito ? CORES.feitoTexto : CORES.titulo,
            textDecoration: item.feito ? 'line-through' : 'none',
          }}
        >
          {item.texto}
        </span>
        <span className="item__rodape" style={{ color: p.texto }}>
          {tag?.nome ?? 'Sem tag'}
          {sufixo}
        </span>
      </div>

      {/* No desktop não existe "segurar": o lápis é o equivalente do gesto
          que o mobile usa para abrir o mesmo modal de edição. */}
      <button
        type="button"
        className="item__editar"
        onClick={aoEditar}
        aria-label={`Editar ${item.texto}`}
      >
        ✎
      </button>

      <button type="button" className="item__remover" onClick={aoRemover} aria-label="Remover item">
        ✕
      </button>
    </div>
  );
}
