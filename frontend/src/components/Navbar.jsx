import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  function sair() { logout(); navigate('/login'); }
  return <header className="site-header"><div className="navbar">
    <Link to="/" className="brand" aria-label="To Work, início"><span className="brand-mark">tw<span className="brand-dot" /></span>To Work<span className="brand-period">.</span></Link>
    <nav aria-label="Navegação principal">
      <NavLink to="/" end>Início</NavLink>
      <a className="how-link" href="/#como-funciona">Como funciona</a>
      {user ? <>
        <NavLink to="/dashboard">Meu painel</NavLink>
        <span className="user-name"><span className="mini-avatar">{user.fullName.charAt(0)}</span>{user.fullName.split(' ')[0]}</span>
        <button className="link-button logout-button" onClick={sair}>Sair <Icon name="exit" size={17} /></button>
      </> : <>
        <Link to="/login" className="login-link">Entrar</Link>
        <Link to="/register" className="nav-button">Criar conta <Icon name="arrow" size={17} /></Link>
      </>}
    </nav>
  </div></header>;
}
