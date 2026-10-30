/*
  Register.jsx
  -----------------------------------------------------------------------------
  Tela de cadastro.

  Fluxo:
  1. usuário informa nome, email, senha e tipo de conta;
  2. o formulário chama criarConta();
  3. criarConta() chama register() do AuthContext;
  4. AuthContext envia POST /api/auth/register;
  5. se der certo, token é salvo e o usuário vai para /dashboard.
*/

import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthAside from '../components/AuthAside.jsx';
import Icon from '../components/Icon.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const destino = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !['/login', '/register'].includes(from) ? from : '/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState(location.state?.accountType === 'PRESTADOR' ? 'PRESTADOR' : 'CLIENTE');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function criarConta(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await register(fullName, email, password, accountType);
      navigate(accountType === 'PRESTADOR' ? '/dashboard' : destino, { replace: true });
    } catch (erro) {
      setError(erro.response?.data?.message || 'Não foi possível criar a conta.');
    } finally { setBusy(false); }
  }

  if (user) return <Navigate to={user.accountType === 'PRESTADOR' ? '/dashboard' : destino} replace />;
  return (
    <div className="auth-page">
      <AuthAside />
      <form className="auth-card" onSubmit={criarConta}>
        <Link className="auth-back" to="/"><Icon name="back" size={15} /> Voltar para o início</Link>
        <span className="eyebrow">Crie sua conta</span>
        <h1>Cadastro</h1>
        <p>Escolha se você quer contratar serviços ou oferecer serviços.</p>

        {error && <div className="alert" role="alert">{error}</div>}

        <label>
          Nome completo
          <input
            autoComplete="name"
            minLength={2}
            maxLength={100}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>

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
            autoComplete="new-password"
            maxLength={72}
            minLength="6"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          Tipo de conta
          <select value={accountType} onChange={(event) => setAccountType(event.target.value)}>
            <option value="CLIENTE">Cliente - Quero contratar serviços</option>
            <option value="PRESTADOR">Prestador - Quero oferecer serviços</option>
          </select>
        </label>

        <button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Criando...' : 'Criar conta'}</button>

        <p className="form-footer">
          Já tem conta? <Link to="/login" state={{ from: destino }}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}
