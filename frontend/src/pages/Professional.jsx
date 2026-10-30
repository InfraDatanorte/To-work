import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { moeda } from '../utils/format.js';
import Icon from '../components/Icon.jsx';

export default function Professional() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  useEffect(() => {
    let active = true;
    setData(null); setError('');
    api.get(`/professionals/${id}`).then(({ data: result }) => {
      if (active) { setData(result); setCategoryId(String(result.categories[0]?.id || '')); }
    }).catch((erro) => { if (active) setError(erro.response?.data?.message || 'Não foi possível carregar o perfil.'); });
    return () => { active = false; };
  }, [id]);

  async function solicitar(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await api.post('/requests', { providerId: Number(id), categoryId: Number(categoryId), title, description, city });
      navigate('/dashboard', { state: { message: 'Solicitação enviada. Acompanhe o orçamento abaixo.' } });
    } catch (erro) { setError(erro.response?.data?.message || 'Não foi possível enviar a solicitação.'); }
    finally { setBusy(false); }
  }
  if (!data) return <div className="page card">{error ? <p role="alert">{error}</p> : <p role="status">Carregando perfil...</p>}<Link to="/">Voltar ao início</Link></div>;
  const p = data.professional;
  return <div className="page professional-page">
    <Link to="/" className="profile-back"><Icon name="back" size={16} />Voltar para os profissionais</Link>
    <section className="profile-hero"><div className="avatar profile-avatar" aria-hidden="true">{p.fullName.split(' ').slice(0, 2).map((part) => part.charAt(0)).join('')}</div>
      <div><span className="eyebrow">CONHEÇA O PROFISSIONAL</span><h1>{p.fullName}</h1>
      <p className="professional-location"><Icon name="pin" size={15} />{[p.city, p.state].filter(Boolean).join(' / ') || 'Localização não informada'}</p>
      <p className="profile-summary">{p.description}</p>
      <div className="category-tags">{data.categories.length ? data.categories.map((c) => <span key={c.id}>{c.name}</span>) : <span>Categorias ainda não informadas</span>}</div></div>
      <div className="profile-price"><span>{p.basePrice != null ? 'SERVIÇOS A PARTIR DE' : 'VAMOS CONVERSAR?'}</span><strong>{p.basePrice != null ? moeda(p.basePrice) : 'Peça um orçamento'}</strong><small>Combine os detalhes e o valor final com o profissional.</small>
      <div className="professional-rating"><Icon name="star" size={16} />{p.reviewsCount ? `${p.rating} / 5 · ${p.reviewsCount} avaliação(ões)` : 'Ainda sem avaliações'}</div></div>
    </section>
    <section className="section">
      <span className="eyebrow">CONTE O QUE VOCÊ PRECISA</span>
      <h2>Solicitar orçamento</h2>
      <p>Um pouco de contexto ajuda o profissional a preparar a melhor proposta.</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {authLoading ? <p role="status">Verificando sessão...</p> : !user ? <div className="card"><p>Entre como cliente para solicitar um serviço.</p><Link className="btn btn-primary" to="/login" state={{ from: `/professionals/${id}` }}>Entrar para solicitar</Link></div>
        : user.accountType !== 'CLIENTE' ? <p>Use uma conta de cliente para solicitar serviços.</p>
        : data.categories.length === 0 ? <p>Este prestador ainda não possui serviços ativos para receber solicitações.</p>
        : <form className="card profile-form" onSubmit={solicitar}>
          <label htmlFor="request-category">Serviço</label><select id="request-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label htmlFor="request-title">Título da solicitação</label><input id="request-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
          <label htmlFor="request-description">Descreva o que você precisa</label><textarea id="request-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} required />
          <label htmlFor="request-city">Cidade do atendimento</label><input id="request-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} required />
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Enviando...' : 'Enviar solicitação'}</button>
        </form>}
    </section>
    <section className="section"><span className="eyebrow">EXPERIÊNCIAS COMPARTILHADAS</span><h2>Avaliações de serviços concluídos</h2>{data.reviews.length === 0 ? <div className="empty-state"><Icon name="star" size={24} /><p>Nenhuma avaliação recebida ainda.</p></div> : <div className="grid">{data.reviews.map((r) => <article key={r.id} className="card review-card"><strong><Icon name="star" size={16} /> Nota {r.rating} / 5</strong><p>{r.comment || 'Avaliação sem comentário.'}</p></article>)}</div>}</section>
  </div>;
}
