import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
export default function Footer() {
  return <footer className="site-footer"><div className="footer-inner">
    <div><Link to="/" className="brand"><span className="brand-mark">tw<span className="brand-dot" /></span>To Work<span className="brand-period">.</span></Link><p>Talentos por perto.<br />Soluções para a sua rotina.</p></div>
    <div className="footer-links"><span>Encontre seu próximo passo</span><Link to="/">Buscar profissionais <Icon name="arrow" size={16} /></Link><Link to="/dashboard">Acompanhar solicitações <Icon name="arrow" size={16} /></Link></div>
    <p className="footer-signature">Conectando pessoas,<br /><strong>fazendo acontecer.</strong><small>© 2026 To Work</small></p>
  </div></footer>;
}
