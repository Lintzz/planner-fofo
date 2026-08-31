/** Modal de novo item das listas de Estudos / Avulsas. */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CHAVES_PALETA,
  GRADIENTES,
  diasAtras,
  hoje,
  rotuloData,
  somarDias,
  textosDaLista,
  type ChavePaleta,
  type PlannerStore,
} from '@planner-fofo/shared';
import { CORES, F, PALETAS, paleta, sombra } from '../tema';
import { Chip, Gradiente, RotuloCampo } from './Base';

const ATALHOS = [
  { nome: 'Ontem', off: 1 },
  { nome: 'Hoje', off: 0 },
  { nome: 'Amanhã', off: -1 },
];

export function ModalItem({ planner }: { planner: PlannerStore }) {
  const { rascunhoItem, estadoLista } = planner;

  // A folha encosta no rodapé, então o conteúdo precisa passar da barra de
  // gestos — senão o botão de salvar fica embaixo dela.
  const insets = useSafeAreaInsets();

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

  const ehEstudos = rascunhoItem?.lista === 'estudos';
  const textos = textosDaLista(Boolean(ehEstudos));

  return (
    <Modal
      visible={Boolean(rascunhoItem)}
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <Pressable style={estilos.fundo} onPress={fechar} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.ancora}
      >
        <View style={[estilos.folha, sombra('forte')]}>
          {rascunhoItem ? (
            <ScrollView
              contentContainerStyle={[estilos.conteudo, { paddingBottom: 26 + insets.bottom }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={estilos.cabecalho}>
                <Text style={estilos.titulo}>{textos.tituloModal}</Text>
                <Pressable onPress={fechar} style={estilos.fechar} hitSlop={8}>
                  <Text style={estilos.fecharIcone}>✕</Text>
                </Pressable>
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>{textos.rotuloCampo}</RotuloCampo>
                <TextInput
                  value={rascunhoItem.texto}
                  onChangeText={(texto) => planner.mudarRascunhoItem({ texto })}
                  onSubmitEditing={() => void planner.salvarItem()}
                  returnKeyType="done"
                  placeholder={textos.placeholder}
                  placeholderTextColor="#d8bede"
                  style={estilos.input}
                />
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>Dia</RotuloCampo>
                <View style={estilos.atalhos}>
                  {ATALHOS.map((atalho) => {
                    const ativo = rascunhoItem.data === diasAtras(atalho.off);
                    const conteudo = (
                      <Text style={[estilos.atalhoTexto, { color: ativo ? '#8b3f9e' : '#c9aec5' }]}>
                        {atalho.nome}
                      </Text>
                    );
                    return (
                      <Pressable
                        key={atalho.nome}
                        style={estilos.atalho}
                        onPress={() => planner.mudarRascunhoItem({ data: diasAtras(atalho.off) })}
                      >
                        {ativo ? (
                          <Gradiente
                            cores={GRADIENTES.diaAtivo}
                            style={[estilos.atalhoInterno, { borderColor: '#e9b8dc' }]}
                          >
                            {conteudo}
                          </Gradiente>
                        ) : (
                          <View
                            style={[
                              estilos.atalhoInterno,
                              { backgroundColor: CORES.cartaoAlt, borderColor: '#f2e6ef' },
                            ]}
                          >
                            {conteudo}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* O `<input type="date">` do design não existe no React Native;
                    o mesmo alcance é dado pelos atalhos mais este passo a passo. */}
                <View style={estilos.seletorData}>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      planner.mudarRascunhoItem({ data: somarDias(rascunhoItem.data, -1) })
                    }
                    style={estilos.seta}
                  >
                    <Text style={estilos.setaTexto}>‹</Text>
                  </Pressable>
                  <Text style={estilos.dataEscolhida}>{rotuloData(rascunhoItem.data)}</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      planner.mudarRascunhoItem({ data: somarDias(rascunhoItem.data, 1) })
                    }
                    style={estilos.seta}
                  >
                    <Text style={estilos.setaTexto}>›</Text>
                  </Pressable>
                </View>

                <Text style={estilos.apoio}>
                  {rascunhoItem.data === hoje()
                    ? 'Entra na lista de hoje 🌸'
                    : `Vai para ${rotuloData(rascunhoItem.data).toLowerCase()} · veja em Histórico`}
                </Text>
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>{textos.rotuloTags}</RotuloCampo>
                <View style={estilos.tags}>
                  {estadoLista.tags.map((tag) => {
                    const p = paleta(tag.cor);
                    const ativo = rascunhoItem.tagId === tag.id;
                    return (
                      <Chip
                        key={tag.id}
                        rotulo={tag.nome}
                        ponto={p.forte}
                        aoTocar={() => planner.mudarRascunhoItem({ tagId: tag.id })}
                        fundo={ativo ? p.bg : CORES.cartaoAlt}
                        borda={ativo ? p.borda : CORES.bordaClara}
                        cor={ativo ? p.texto : '#bfa3ca'}
                      >
                        {gerenciando ? (
                          <Pressable
                            hitSlop={6}
                            onPress={() => void planner.excluirTag(tag.id)}
                            style={estilos.excluirTag}
                          >
                            <Text style={estilos.excluirTagIcone}>✕</Text>
                          </Pressable>
                        ) : null}
                      </Chip>
                    );
                  })}

                  <Pressable onPress={() => setCriando((v) => !v)} style={estilos.novaTag}>
                    <Text style={estilos.novaTagTexto}>
                      {criando ? 'cancelar' : '+ nova tag'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => setGerenciando((v) => !v)} hitSlop={6}>
                    <Text style={estilos.link}>{gerenciando ? 'pronto' : 'editar tags'}</Text>
                  </Pressable>
                </View>
              </View>

              {criando ? (
                <View style={estilos.painelNovaTag}>
                  <TextInput
                    value={nomeTag}
                    onChangeText={setNomeTag}
                    placeholder="Nome da tag (ex: Estatística)"
                    placeholderTextColor="#d8bede"
                    style={[estilos.input, { backgroundColor: '#fff' }]}
                  />
                  <View style={estilos.coresTag}>
                    {CHAVES_PALETA.map((chave) => (
                      <Pressable
                        key={chave}
                        accessibilityLabel={`Cor ${chave}`}
                        onPress={() => setCorTag(chave)}
                        style={[
                          estilos.corTag,
                          {
                            backgroundColor: PALETAS[chave].forte,
                            borderColor: corTag === chave ? CORES.titulo : '#ffffff',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Pressable
                    style={estilos.criarTag}
                    onPress={async () => {
                      await planner.criarTag(nomeTag, corTag);
                      setNomeTag('');
                      setCriando(false);
                    }}
                  >
                    <Text style={estilos.criarTagTexto}>Criar tag 🎀</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable onPress={() => void planner.salvarItem()}>
                <Gradiente
                  cores={GRADIENTES.primario}
                  style={[estilos.salvar, sombra('media', '#b450b4')]}
                >
                  <Text style={estilos.salvarTexto}>{textos.rotuloSalvar}</Text>
                </Gradiente>
              </Pressable>

              <Text style={estilos.nota}>isso não entra na porcentagem do dia 💗</Text>
            </ScrollView>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(107, 61, 122, 0.28)' },
  ancora: { flex: 1, justifyContent: 'flex-end' },
  folha: {
    maxHeight: '94%',
    backgroundColor: CORES.cartao,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  conteudo: { padding: 22, paddingBottom: 34, gap: 16 },

  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontFamily: F.baloo, fontSize: 20, color: CORES.titulo },
  fechar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CORES.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fecharIcone: { color: CORES.fechar, fontSize: 14 },

  campo: { gap: 8 },
  input: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: CORES.campoBorda,
    backgroundColor: CORES.campoFundo,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: F.nunito,
    fontSize: 14,
    color: CORES.titulo,
  },

  atalhos: { flexDirection: 'row', gap: 7 },
  atalho: { flex: 1 },
  atalhoInterno: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  atalhoTexto: { fontFamily: F.baloo, fontSize: 13 },

  seletorData: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CORES.campoBorda,
    backgroundColor: CORES.campoFundo,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  seta: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  setaTexto: { fontFamily: F.baloo, fontSize: 22, color: CORES.fechar },
  dataEscolhida: { fontFamily: F.nunito, fontSize: 13.5, color: CORES.titulo },
  apoio: { fontFamily: F.nunito, fontSize: 11.5, color: CORES.apoio },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
  excluirTag: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  excluirTagIcone: { fontSize: 10, color: '#c08fb4' },
  novaTag: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#e9c4dd',
    backgroundColor: CORES.cartaoAlt,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  novaTagTexto: { fontFamily: F.nunitoExtra, fontSize: 12, color: '#c07fb3' },
  link: {
    fontFamily: F.nunitoExtra,
    fontSize: 11.5,
    color: CORES.apoio,
    textDecorationLine: 'underline',
    padding: 6,
  },

  painelNovaTag: {
    borderRadius: 22,
    padding: 15,
    backgroundColor: '#fdf4fa',
    borderWidth: 1.5,
    borderColor: '#f6e0f0',
    gap: 12,
  },
  coresTag: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  corTag: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
  criarTag: {
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#f7e3f3',
    alignItems: 'center',
  },
  criarTagTexto: { fontFamily: F.baloo, fontSize: 14, color: '#a8579a' },

  salvar: { borderRadius: 20, paddingVertical: 15, alignItems: 'center' },
  salvarTexto: { fontFamily: F.baloo, fontSize: 15.5, color: '#fff' },
  nota: { textAlign: 'center', fontFamily: F.nunito, fontSize: 11, color: CORES.apoio },
});
