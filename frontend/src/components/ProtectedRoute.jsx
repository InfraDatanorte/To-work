/*
  ProtectedRoute.jsx
  -----------------------------------------------------------------------------
  Este componente protege páginas que exigem login.

  No projeto, ele protege o Dashboard.
*/

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading, sessionError, retrySession } = useAuth();
  const location = useLocation();

  // Enquanto o AuthContext verifica se existe token válido, mostramos carregando.
  if (loading) {
    return <p className="loading">Verificando autenticação...</p>;
  }

  // Se não houver usuário logado, redireciona para o login.
  if (sessionError) return <div className="page card"><p role="alert">{sessionError}</p><button className="btn btn-primary" onClick={retrySession}>Tentar novamente</button></div>;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Se existe usuário, libera a página protegida.
  return children;
}
