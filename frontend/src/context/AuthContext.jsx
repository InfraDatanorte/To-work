import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/api.js';
const AuthContext = createContext();
const TOKEN_KEY = '@towork:token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function carregarSessao() {
    setLoading(true);
    setSessionError('');
    try {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (erro) {
      if (erro.response?.status === 401) logout();
      else setSessionError('Não foi possível verificar sua sessão. Confira a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarSessao();
    const expirada = () => logout();
    const mudou = (event) => { if (event.key === TOKEN_KEY) carregarSessao(); };
    window.addEventListener('towork:unauthorized', expirada);
    window.addEventListener('storage', mudou);
    return () => {
      window.removeEventListener('towork:unauthorized', expirada);
      window.removeEventListener('storage', mudou);
    };
  }, []);

  function salvarSessao(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setSessionError('');
  }
  async function register(fullName, email, password, accountType) {
    const { data } = await api.post('/auth/register', { fullName, email, password, accountType });
    salvarSessao(data);
  }
  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    salvarSessao(data);
  }
  return <AuthContext.Provider value={{ user, loading, sessionError, retrySession: carregarSessao, register, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
