/** Folha inferior de novo/editar hábito fixo. */
import React from 'react';
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
  CORES_HABITO,
  DIAS,
  EMOJIS_HABITO,
  GRADIENTES,
  resumoAgenda,
  type PlannerStore,
} from '@planner-fofo/shared';
import { CORES, F, PALETAS, sombra } from '../tema';
import { Gradiente, RotuloCampo } from './Base';

export function FolhaHabito({ planner }: { planner: PlannerStore }) {
  const { rascunho } = planner;

  // A folha encosta no rodapé, então o conteúdo precisa passar da barra de
  // gestos — senão o botão de salvar fica embaixo dela.
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(rascunho)}
      transparent
      animationType="slide"
      onRequestClose={planner.fecharRascunho}
    >
      <Pressable style={estilos.fundo} onPress={planner.fecharRascunho} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.ancora}
      >
        <View style={[estilos.folha, sombra('forte')]}>
          {rascunho ? (
            <ScrollView
              contentContainerStyle={[estilos.conteudo, { paddingBottom: 26 + insets.bottom }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={estilos.cabecalho}>
                <Text style={estilos.titulo}>
                  {rascunho.id ? 'Editar hábito' : 'Novo hábito fixo'}
                </Text>
                <Pressable onPress={planner.fecharRascunho} style={estilos.fechar} hitSlop={8}>
                  <Text style={estilos.fecharIcone}>✕</Text>
                </Pressable>
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>Nome do hábito</RotuloCampo>
                <TextInput
                  value={rascunho.nome}
                  onChangeText={(nome) => planner.mudarRascunho({ nome })}
                  placeholder="Ex: Tomar 2L de água"
                  placeholderTextColor="#d8bede"
                  style={estilos.input}
                />
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>Iconezinho</RotuloCampo>
                <View style={estilos.grade}>
                  {EMOJIS_HABITO.map((emoji) => {
                    const ativo = rascunho.emoji === emoji;
                    return (
                      <Pressable
                        key={emoji}
                        onPress={() => planner.mudarRascunho({ emoji })}
                        style={[
                          estilos.emojiBotao,
                          {
                            backgroundColor: ativo ? '#fff0f8' : CORES.cartaoAlt,
                            borderColor: ativo ? '#f2a8d5' : '#f6e6f0',
                          },
                        ]}
                      >
                        <Text style={estilos.emoji}>{emoji}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>Cor</RotuloCampo>
                <View style={estilos.cores}>
                  {CORES_HABITO.map((chave) => (
                    <Pressable
                      key={chave}
                      accessibilityLabel={`Cor ${chave}`}
                      onPress={() => planner.mudarRascunho({ cor: chave })}
                      style={[
                        estilos.corBotao,
                        {
                          backgroundColor: PALETAS[chave].forte,
                          borderColor: rascunho.cor === chave ? CORES.titulo : '#ffffff',
                        },
                        sombra('suave'),
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={estilos.campo}>
                <RotuloCampo>Dias da semana</RotuloCampo>
                <View style={estilos.dias}>
                  {DIAS.map((rotulo, i) => {
                    const ativo = rascunho.agenda[i];
                    const conteudo = (
                      <Text
                        style={[estilos.diaTexto, { color: ativo ? '#8b3f9e' : '#c9aec5' }]}
                      >
                        {rotulo}
                      </Text>
                    );
                    return (
                      <Pressable
                        key={i}
                        onPress={() => planner.alternarDiaDoRascunho(i)}
                        style={estilos.diaBotao}
                      >
                        {ativo ? (
                          <Gradiente
                            cores={GRADIENTES.diaAtivo}
                            style={[estilos.diaInterno, { borderColor: '#e9b8dc' }]}
                          >
                            {conteudo}
                          </Gradiente>
                        ) : (
                          <View
                            style={[
                              estilos.diaInterno,
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
                <Text style={estilos.apoio}>{resumoAgenda(rascunho.agenda)}</Text>
              </View>

              <View style={estilos.acoes}>
                {rascunho.id ? (
                  <Pressable onPress={() => void planner.excluirDoRascunho()} style={estilos.excluir}>
                    <Text style={estilos.excluirTexto}>Excluir</Text>
                  </Pressable>
                ) : null}

                <Pressable style={estilos.salvar} onPress={() => void planner.salvarRascunho()}>
                  <Gradiente
                    cores={GRADIENTES.primario}
                    style={[estilos.salvarInterno, sombra('media', '#b450b4')]}
                  >
                    <Text style={estilos.salvarTexto}>Salvar hábito 💗</Text>
                  </Gradiente>
                </Pressable>
              </View>
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
    maxHeight: '92%',
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

  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBotao: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 19 },

  cores: { flexDirection: 'row', gap: 10 },
  corBotao: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },

  dias: { flexDirection: 'row', gap: 7 },
  diaBotao: { flex: 1 },
  diaInterno: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  diaTexto: { fontFamily: F.baloo, fontSize: 13.5 },
  apoio: { fontFamily: F.nunito, fontSize: 11.5, color: CORES.apoio },

  acoes: { flexDirection: 'row', gap: 10, marginTop: 2 },
  excluir: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f2e0ec',
    backgroundColor: CORES.cartaoAlt,
    justifyContent: 'center',
  },
  excluirTexto: { fontFamily: F.baloo, fontSize: 14, color: '#c08fb4' },
  salvar: { flex: 1 },
  salvarInterno: { borderRadius: 20, paddingVertical: 15, alignItems: 'center' },
  salvarTexto: { fontFamily: F.baloo, fontSize: 15.5, color: '#fff' },
});
