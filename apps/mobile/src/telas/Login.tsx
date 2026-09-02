/** Entrada e cadastro. Mesma linguagem visual do resto do app. */
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GRADIENTES, cadastrar, entrar } from '@planner-fofo/shared';
import { obterSupabase } from '../lib/supabase';
import { CORES, F, sombra } from '../tema';
import { Gradiente, RotuloCampo } from '../componentes/Base';
import Rodinha from '../componentes/Rodinha';

export function Login() {
  const supabase = useMemo(() => obterSupabase(), []);
  const insets = useSafeAreaInsets();
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ehCadastro = modo === 'cadastrar';

  const enviar = async () => {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    try {
      if (ehCadastro) {
        await cadastrar(supabase, email, senha, nome || 'Manu');
        // Com confirmação de e-mail ligada, a sessão só vem depois do clique.
        setAviso('Conta criada! Confirme o e-mail se pedirmos, e entre 🌸');
        setModo('entrar');
      } else {
        await entrar(supabase, email, senha);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui agora. Tente de novo 💗');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={estilos.raiz}
    >
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: 26 + insets.top, paddingBottom: 26 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.marca}>
          <Gradiente cores={GRADIENTES.primario} style={[estilos.logo, sombra('media', '#b450b4')]}>
            <Text style={estilos.logoEmoji}>🌸</Text>
          </Gradiente>
          <Text style={estilos.titulo}>Planner Fofo</Text>
          <Text style={estilos.subtitulo}>rotina leve e coloridinha</Text>
        </View>

        <View style={[estilos.cartao, sombra('media')]}>
          {ehCadastro ? (
            <View style={estilos.campo}>
              <RotuloCampo>Como te chamamos?</RotuloCampo>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Manu"
                placeholderTextColor="#d8bede"
                style={estilos.input}
              />
            </View>
          ) : null}

          <View style={estilos.campo}>
            <RotuloCampo>E-mail</RotuloCampo>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="voce@email.com"
              placeholderTextColor="#d8bede"
              style={estilos.input}
            />
          </View>

          <View style={estilos.campo}>
            <RotuloCampo>Senha</RotuloCampo>
            {/* O olhinho fica por cima do input, que abre espaço à direita. */}
            <View style={estilos.campoSenha}>
              <TextInput
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoComplete={ehCadastro ? 'new-password' : 'current-password'}
                placeholder="pelo menos 6 caracteres"
                placeholderTextColor="#d8bede"
                style={[estilos.input, estilos.inputSenha]}
              />
              <Pressable
                onPress={() => setMostrarSenha((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ selected: mostrarSenha }}
                accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={estilos.olho}
              >
                <Text style={estilos.olhoIcone}>{mostrarSenha ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
          </View>

          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
          {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

          <Pressable onPress={() => void enviar()} disabled={ocupado}>
            <Gradiente
              cores={GRADIENTES.primario}
              style={[estilos.botao, sombra('media', '#b450b4'), ocupado && estilos.ocupado]}
            >
              {ocupado ? (
                <Rodinha cor="#fff" />
              ) : (
                <Text style={estilos.botaoTexto}>
                  {ehCadastro ? 'Criar minha conta 💗' : 'Entrar 🌷'}
                </Text>
              )}
            </Gradiente>
          </Pressable>

          <Pressable onPress={() => setModo(ehCadastro ? 'entrar' : 'cadastrar')}>
            <Text style={estilos.alternar}>
              {ehCadastro ? 'já tenho conta' : 'quero criar uma conta'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: 26, gap: 26 },

  marca: { alignItems: 'center', gap: 6 },
  logo: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 30 },
  titulo: { fontFamily: F.balooExtra, fontSize: 28, color: CORES.titulo },
  subtitulo: { fontFamily: F.nunito, fontSize: 12.5, color: CORES.rotulo },

  cartao: {
    backgroundColor: CORES.cartao,
    borderRadius: 32,
    padding: 22,
    borderWidth: 1.5,
    borderColor: CORES.bordaCartao,
    gap: 16,
  },
  campo: { gap: 7 },
  campoSenha: { justifyContent: 'center' },
  inputSenha: { paddingRight: 50 },
  olho: {
    position: 'absolute',
    right: 6,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  olhoIcone: { fontSize: 16 },
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
  erro: { fontFamily: F.nunito, fontSize: 12.5, color: '#c9438f' },
  aviso: { fontFamily: F.nunito, fontSize: 12.5, color: '#7d4fbf' },

  botao: { borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  ocupado: { opacity: 0.7 },
  botaoTexto: { fontFamily: F.baloo, fontSize: 15.5, color: '#fff' },
  alternar: {
    textAlign: 'center',
    fontFamily: F.nunitoExtra,
    fontSize: 12,
    color: CORES.apoio,
    textDecorationLine: 'underline',
  },
});
