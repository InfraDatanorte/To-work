import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { moeda } from '../utils/format.js';
import Icon, { categoryIcon } from '../components/Icon.jsx';
import HeroVisual from '../components/HeroVisual.jsx';
import CategoryOptions from '../components/CategoryOptions.jsx';

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function buscar(filters = {}) {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/professionals', { params: filters });
      setProfessionals(data.professionals);
    } catch {
      setError('Não foi possível carregar os prestadores. Verifique se a API está disponível.');
    } finally { setLoading(false); }
  }
  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories))
      .catch(() => setError('Não foi possível carregar as categorias. Tente recarregar a página.'));
    buscar();
  }, []);
  function pesquisar(event) {
    event.preventDefault();
    buscar({ q, city, ...(categoryId ? { categoryId } : {}) });
  }
  function filtrarCategoria(id) {
    setCategoryId(String(id)); buscar({ q, city, categoryId: id });
    document.getElementById('prestadores')?.scrollIntoView({ behavior: 'smooth' });
  }
  function limpar() { setQ(''); setCity(''); setCategoryId(''); buscar(); }
  const featuredNames = ['Elétrica', 'Hidráulica', 'Informática', 'Jardinagem', 'Limpeza', 'Pintura'];
  const featuredCategories = featuredNames.map((name) => categories.find((category) => category.name === name)).filter(Boolean);
  function explorarCategorias() {
    const select = document.getElementById('search-category');
    select?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    select?.focus({ preventScroll: true });
    try { select?.showPicker?.(); } catch { /* A lista continua acessível pelo teclado e pelo toque. */ }
  }

  return <div className="page home-page">
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-eyebrow"><span className="tiny-dot" /> Gente que sabe fazer, perto de você.</span>
        <h1>O profissional certo.<br />Para o que você <span>precisa.</span></h1>
        <p>Do pequeno reparo ao próximo projeto. Encontre profissionais, combine os detalhes e deixe a sua rotina mais leve.</p>
        <div className="actions hero-actions"><a href="#busca" className="btn btn-primary">Encontrar um profissional <Icon name="arrow" size={18} /></a>
          <Link to={user ? '/dashboard' : '/register'} state={{ accountType: 'PRESTADOR' }} className="text-link">{user ? 'Ir para meu painel' : 'Quero oferecer serviços'} <Icon name="arrow" size={16} /></Link></div>
        <div className="hero-note"><span className="note-icon"><Icon name="check" size={14} /></span> Você escolhe. Você combina. Você avalia.</div>
      </div>
      <HeroVisual />
    </section>

    <div className="search-area" id="busca">
      <form className="search-card" onSubmit={pesquisar}>
        <div className="search-field"><label htmlFor="search-service"><Icon name="search" size={16} />Que serviço você precisa?</label><input id="search-service" placeholder="Elétrica, limpeza, informática..." value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} /></div>
        <div className="search-field"><label htmlFor="search-city"><Icon name="pin" size={16} />Cidade</label><input id="search-city" placeholder="Onde você está?" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} /></div>
        <div className="search-field"><label htmlFor="search-category"><Icon name="grid" size={16} />Categoria</label><select id="search-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><CategoryOptions categories={categories} emptyLabel="Todas as categorias" /></select></div>
        <button className="btn btn-primary search-submit" disabled={loading}><Icon name="search" size={19} />Buscar</button>
      </form>
      <div className="search-hint"><span>Uma boa solução começa com uma busca.</span><button type="button" className="link-button" onClick={limpar} disabled={loading}>Limpar</button></div>
    </div>

    <section className="section categories-section">
      <div className="section-heading"><div><span className="eyebrow">PARA CADA NECESSIDADE</span><h2>Categorias de serviços</h2><p>Uma ajuda para cada parte da sua rotina.{categories.length > 6 && ` Explore ${categories.length} áreas de atuação na busca.`}</p></div><button type="button" className="text-link all-categories-button" onClick={explorarCategorias}>Ver todas as categorias <Icon name="arrow" size={18} /></button></div>
      <div className="category-grid">{featuredCategories.map((c, index) => <button className={`category-card ${String(c.id) === categoryId ? 'category-selected' : ''}`} key={c.id} onClick={() => filtrarCategoria(c.id)} disabled={loading} aria-label={`Ver profissionais de ${c.name}`}>
        <span className={`category-symbol tone-${['lilac', 'blue', 'mint', 'peach', 'yellow', 'pink'][index % 6]}`}><Icon name={categoryIcon(c.name)} size={25} /></span>
        <h3>{c.name}</h3><p>{c.description}</p><span className="category-arrow"><Icon name="arrow" size={18} /></span>
      </button>)}</div>
    </section>

    <section className="section professionals-section" id="prestadores" aria-live="polite" aria-busy={loading}>
      <div className="section-heading"><div><span className="eyebrow">TALENTOS QUE FAZEM ACONTECER</span><h2>Prestadores cadastrados</h2><p>Conheça o trabalho. Encontre a pessoa certa.</p></div>{!loading && !error && <span className="results-count">{professionals.length} {professionals.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}</span>}</div>
      {error && <div className="alert" role="alert">{error}<button className="link-button" onClick={() => buscar({ q, city, ...(categoryId ? { categoryId } : {}) })}>Tentar novamente</button></div>}
      {loading ? <div className="empty-state" role="status"><Icon name="search" size={28} /><p>Carregando prestadores...</p></div> : !error && (professionals.length === 0 ? <div className="empty-state"><span className="empty-symbol"><Icon name="search" size={28} /></span><h3>Nenhum prestador encontrado.</h3><p>Experimente outra busca ou limpe os filtros.</p><button className="btn btn-outline" onClick={limpar}>Ver todos os profissionais</button></div> : <div className="professionals-grid">{professionals.map((p, index) => <article className="card professional" key={p.id}>
        <div className="professional-top"><div className={`avatar avatar-${index % 4}`} aria-hidden="true">{p.fullName.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('')}</div><span className="professional-rating"><Icon name="star" size={15} />{p.reviewsCount ? `${p.rating} (${p.reviewsCount})` : 'Sem avaliações'}</span></div>
        <h3>{p.fullName}</h3><p className="professional-location"><Icon name="pin" size={14} />{[p.city, p.state].filter(Boolean).join(' / ') || 'Localização não informada'}</p>
        <div className="category-tags">{p.categoryNames ? p.categoryNames.split(', ').map((name) => <span key={name}>{name}</span>) : <span>Serviços a informar</span>}</div>
        <p className="professional-description">{p.description}</p>
        <div className="professional-bottom"><div><small>{p.basePrice != null ? 'A partir de' : 'Vamos conversar?'}</small><strong>{p.basePrice != null ? moeda(p.basePrice) : 'Peça um orçamento'}</strong></div><Link className="profile-link" to={`/professionals/${p.id}`} aria-label={`Ver perfil de ${p.fullName}`}>Ver perfil <Icon name="arrow" size={17} /></Link></div>
      </article>)}</div>)}
    </section>

    <section className="section how-section" id="como-funciona"><div className="section-heading"><div><span className="eyebrow">SIMPLES DO COMEÇO AO FIM</span><h2>Uma boa conexão resolve.</h2><p>O próximo passo é mais fácil do que parece.</p></div></div>
      <div className="steps-grid">{[{ icon: 'search', title: 'Encontre seu profissional', text: 'Explore as categorias e busque quem atende na sua cidade.' }, { icon: 'message', title: 'Combine o serviço', text: 'Conte o que precisa, receba um orçamento e decida com calma.' }, { icon: 'star', title: 'Resolva e avalie', text: 'Acompanhe o atendimento e compartilhe sua experiência ao final.' }].map((step, index) => <article className="step" key={step.title}><div className="step-top"><span className="step-icon"><Icon name={step.icon} size={24} /></span><span className="step-number">0{index + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
    </section>
    {!user && <section className="provider-banner"><div><span className="eyebrow">SEU TALENTO TEM LUGAR AQUI</span><h2>Você sabe fazer.<br />Tem gente precisando.</h2><p>Crie seu perfil e conecte seu trabalho a novas oportunidades.</p></div><Link to="/register" state={{ accountType: 'PRESTADOR' }} className="btn btn-dark">Quero oferecer serviços <Icon name="arrow" size={18} /></Link></section>}
  </div>;
}
