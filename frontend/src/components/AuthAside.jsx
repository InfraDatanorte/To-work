import Icon from './Icon.jsx';

export default function AuthAside() {
  return <aside className="auth-story">
    <span className="story-label">BOAS CONEXÕES COMEÇAM AQUI</span>
    <h2>Uma mão para<br />o que você<br /><em>precisa.</em></h2>
    <p>Quem procura encontra.<br />Quem sabe fazer tem seu espaço.</p>
    <div className="story-features">
      <div><span><Icon name="search" size={20} /></span><div><strong>Encontre o profissional</strong><small>Busque por serviço e cidade.</small></div></div>
      <div><span><Icon name="message" size={20} /></span><div><strong>Combine os detalhes</strong><small>Solicite e acompanhe o orçamento.</small></div></div>
      <div><span><Icon name="star" size={20} /></span><div><strong>Compartilhe sua experiência</strong><small>Avalie depois do serviço concluído.</small></div></div>
    </div>
    <span className="story-footer">Seu dia a dia, com mais possibilidades.</span>
  </aside>;
}
