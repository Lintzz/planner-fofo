/** Entrada e cadastro no desktop. */
import React, { useState } from 'react';
import { cadastrar, entrar } from '@planner-fofo/shared';
import { supabase } from '../lib/supabase';

export function Login() {
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ehCadastro = modo === 'cadastrar';

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : 'Não consegui agora. Tente de novo 💗',
      );
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="centro">
      <div className="login">
        <div className="login__marca">
          <div className="login__logo">🌸</div>
          <span className="login__titulo">Planner Fofo</span>
          <span className="login__slogan">rotina leve e coloridinha</span>
        </div>

        <form className="login__cartao" onSubmit={enviar}>
          {ehCadastro ? (
            <label className="campo">
              <span className="campo__rotulo">Como te chamamos?</span>
              <input
                className="campo__input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Manu"
              />
            </label>
          ) : null}

          <label className="campo">
            <span className="campo__rotulo">E-mail</span>
            <input
              className="campo__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </label>

          <label className="campo">
            <span className="campo__rotulo">Senha</span>
            <input
              className="campo__input"
              type="password"
              autoComplete={ehCadastro ? 'new-password' : 'current-password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="pelo menos 6 caracteres"
              required
            />
          </label>

          {erro ? <span className="login__erro">{erro}</span> : null}
          {aviso ? <span className="login__aviso">{aviso}</span> : null}

          <button type="submit" className="botao-salvar" disabled={ocupado}>
            {ocupado ? 'Um instante…' : ehCadastro ? 'Criar minha conta 💗' : 'Entrar 🌷'}
          </button>

          <button
            type="button"
            className="login__alternar"
            onClick={() => setModo(ehCadastro ? 'entrar' : 'cadastrar')}
          >
            {ehCadastro ? 'já tenho conta' : 'quero criar uma conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
