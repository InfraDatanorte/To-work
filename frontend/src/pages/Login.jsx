/*
  Login.jsx
  -----------------------------------------------------------------------------
  Tela de login.

  Fluxo:
  1. usuário digita email e senha;
  2. o formulário chama a função entrar();
  3. entrar() chama login() do AuthContext;
  4. AuthContext envia POST /api/auth/login;
  5. se der certo, o usuário vai para /dashboard.
*/

import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthAside from '../components/AuthAside.jsx';
import Icon from '../components/Icon.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const destino = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !['/login', '/register'].includes(from) ? from : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function entrar(event) {
    // Evita o recarregamento padrão do formulário HTML.
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await login(email, password);
      navigate(destino, { replace: true });
    } catch (erro) {
      setError(erro.response?.data?.message || 'Não foi possível fazer login.');
    } finally { setBusy(false); }
  }

  if (user) return <Navigate to={destino} replace />;
  return (
    <div className="auth-page">
      <AuthAside />
      <form className="auth-card" onSubmit={entrar}>
        <Link className="auth-back" to="/"><Icon name="back" size={15} /> Voltar para o início</Link>
        <span className="eyebrow">Bem-vindo de volta</span>
        <h1>Entrar na conta</h1>
        <p>Acesse sua conta para continuar usando a plataforma.</p>

        {error && <div className="alert" role="alert">{error}</div>}

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>

        <p className="form-footer">
          Ainda não tem conta? <Link to="/register" state={{ from: destino }}>Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
