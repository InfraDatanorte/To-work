import { useEffect, useState } from 'react';
import api from '../api/api.js';
import { moeda, nomesStatus } from '../utils/format.js';

function RequestCard({ request: r, client, busy, executar }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  function status(value) { executar(() => api.patch(`/requests/${r.id}`, { status: value })); }
  function orcar(e) { e.preventDefault(); executar(() => api.patch(`/requests/${r.id}`, { status: 'ORCADO', amount: Number(amount), message })); }
  function avaliar(e) { e.preventDefault(); executar(() => api.post(`/requests/${r.id}/review`, { rating: Number(rating), comment })); }
  return <article className="card request-card">
    <div className="request-heading"><h3>{r.title}</h3><span className={`status status-${r.status.toLowerCase()}`}>{r.status === 'ORCADO' && !client ? 'Orçamento enviado' : nomesStatus[r.status]}</span></div>
    <p><strong>{client ? 'Prestador' : 'Cliente'}:</strong> {client ? r.providerName : r.clientName}</p>
    <p><strong>Serviço:</strong> {r.categoryName} · {r.city}</p><p>{r.description}</p>
    {r.quoteCents != null && <p><strong>Orçamento: {moeda(r.quoteCents / 100)}</strong><br />{r.quoteMessage}</p>}
    {r.providerPhone && client && <p><strong>Telefone do prestador:</strong> {r.providerPhone}</p>}
    {!client && r.status === 'PENDENTE' && <form onSubmit={orcar}>
      <label htmlFor={`amount-${r.id}`}>Valor do orçamento em R$</label><input id={`amount-${r.id}`} type="number" min="0.01" max="1000000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <label htmlFor={`quote-${r.id}`}>Detalhes do orçamento (opcional)</label><textarea id={`quote-${r.id}`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
      <button className="btn btn-primary" disabled={busy}>Enviar orçamento</button>
    </form>}
    <div className="actions">
      {client && r.status === 'ORCADO' && <><button className="btn btn-primary" disabled={busy} onClick={() => status('ACEITO')}>Aceitar orçamento</button><button className="btn btn-outline" disabled={busy} onClick={() => status('RECUSADO')}>Recusar orçamento</button></>}
      {client && ['PENDENTE', 'ORCADO'].includes(r.status) && <button className="btn btn-outline" disabled={busy} onClick={() => status('CANCELADO')}>Cancelar solicitação</button>}
      {!client && r.status === 'PENDENTE' && <button className="btn btn-outline" disabled={busy} onClick={() => status('RECUSADO')}>Recusar solicitação</button>}
      {!client && r.status === 'ACEITO' && <button className="btn btn-primary" disabled={busy} onClick={() => status('CONCLUIDO')}>Concluir serviço</button>}
    </div>
    {r.reviewRating != null && <p><strong>Avaliação: {r.reviewRating} / 5</strong><br />{r.reviewComment}</p>}
    {client && r.status === 'CONCLUIDO' && r.reviewRating == null && <form onSubmit={avaliar}>
      <h4>Avaliar serviço concluído</h4><label htmlFor={`rating-${r.id}`}>Nota</label><select id={`rating-${r.id}`} value={rating} onChange={(e) => setRating(e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} de 5</option>)}</select>
      <label htmlFor={`comment-${r.id}`}>Comentário (opcional)</label><textarea id={`comment-${r.id}`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
      <button className="btn btn-primary" disabled={busy}>Enviar avaliação</button>
    </form>}
  </article>;
}

export default function Requests({ accountType }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  async function carregar() {
    setLoading(true); setError('');
    try { const { data } = await api.get('/requests'); setRequests(data.requests); }
    catch { setError('Não foi possível carregar as solicitações.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);
  async function executar(acao) {
    setBusy(true); setError(''); setMessage('');
    try { const { data } = await acao(); await carregar(); setMessage(data.message); }
    catch (erro) { setError(erro.response?.data?.message || 'Não foi possível concluir a operação. Atualize e tente novamente.'); }
    finally { setBusy(false); }
  }
  const list = requests.filter((r) => !filter || r.status === filter);
  return <section className="section" id="solicitacoes"><span className="eyebrow">CADA ETAPA, EM UM SÓ LUGAR</span><h2>{accountType === 'CLIENTE' ? 'Minhas solicitações' : 'Solicitações recebidas'}</h2>
    <p>Acompanhe a solicitação, o orçamento e a conclusão do serviço.</p>
    <div className="filter-row"><label htmlFor="request-status">Filtrar por situação</label><select id="request-status" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">Todas</option>{Object.entries(nomesStatus).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select><button className="btn btn-outline" onClick={carregar} disabled={busy || loading}>Atualizar solicitações</button></div>
    {error && <div className="alert" role="alert">{error}</div>}{message && <div className="notice" role="status">{message}</div>}
    {loading ? <p role="status">Carregando solicitações...</p> : list.length === 0 ? <div className="card"><p>Nenhuma solicitação nesta situação.</p></div> : <div className="request-list">{list.map((r) => <RequestCard key={r.id} request={r} client={accountType === 'CLIENTE'} busy={busy} executar={executar} />)}</div>}
  </section>;
}
