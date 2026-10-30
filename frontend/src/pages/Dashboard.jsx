import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProviderProfile from '../components/ProviderProfile.jsx';
import Requests from '../components/Requests.jsx';
import Icon from '../components/Icon.jsx';
import CategoryOptions from '../components/CategoryOptions.jsx';
import api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [linked, setLinked] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function carregarCategorias() {
    const [lista, vinculos] = await Promise.all([
      api.get('/categories'),
      api.get('/provider/categories')
    ]);
    setCategories(lista.data.categories);
    setLinked(vinculos.data.categories);
  }

  useEffect(() => {
    if (user.accountType === 'PRESTADOR') {
      carregarCategorias().catch((erro) => setError(erro.response?.data?.message || 'Não foi possível carregar as categorias.'));
    }
  }, [user.accountType]);

  async function executarAcao(acao, sucesso) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await acao();
      await carregarCategorias();
      setMessage(sucesso);
    } catch (erro) {
      setError(erro.response?.data?.message || 'Não foi possível salvar a alteração.');
    } finally {
      setBusy(false);
    }
  }

  function vincularCategoria(event) {
    event.preventDefault();
    executarAcao(async () => {
      await api.post('/provider/categories', { categoryId: Number(categoryId) });
      setCategoryId('');
      setCategorySearch('');
    }, 'Categoria vinculada ao seu perfil.');
  }

  function alterarStatus(category, status) {
    executarAcao(
      () => api.patch(`/provider/categories/${category.id}`, { status }),
      `Categoria ${status === 'ATIVO' ? 'ativada' : 'desativada'}.`
    );
  }

  const available = categories.filter((category) => !linked.some((item) => item.id === category.id));
  const normalizar = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredCategories = available.filter((category) => normalizar(`${category.name} ${category.description || ''} ${category.keywords || ''} ${category.group || ''}`).includes(normalizar(categorySearch.trim())));

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-intro"><span className="eyebrow">SEU ESPAÇO NO TO WORK</span><span className="role-badge"><Icon name={user.accountType === 'PRESTADOR' ? 'bag' : 'user'} size={15} />{user.accountType === 'PRESTADOR' ? 'Conta de prestador' : 'Conta de cliente'}</span></div>
        <h1>Olá, {user.fullName}</h1>
        <p>{user.accountType === 'PRESTADOR' ? 'Seu talento em movimento. Acompanhe os pedidos e cuide do seu perfil.' : 'Suas próximas soluções começam aqui. Acompanhe os serviços que você solicitou.'}</p>
        <div className="dashboard-links"><a href="#solicitacoes">Minhas solicitações</a>{user.accountType === 'PRESTADOR' && <><a href="#meu-perfil">Perfil profissional</a><a href="#meus-servicos">Meus serviços</a></>}</div>
      </section>

      <section className="dashboard-grid">
        <article className="card account-card">
          <div className="avatar" aria-hidden="true">{user.fullName.charAt(0)}</div><div>
          <h3>Dados da conta</h3>
          <p>{user.email}</p>
          <p>{user.accountType === 'PRESTADOR' ? 'Aqui, seu trabalho ganha novas conexões.' : 'Tudo pronto para encontrar a ajuda certa.'}</p>
          </div>
        </article>

        <article className="card explore-card"><div>
          <h3>Prestadores cadastrados</h3>
          <p>Uma nova conexão pode resolver o seu dia.</p></div>
          <Link to="/" className="btn btn-outline">Ver prestadores <Icon name="arrow" size={16} /></Link>
        </article>
      </section>

      {location.state?.message && <p className="notice" role="status">{location.state.message}</p>}
      <Requests key={user.id} accountType={user.accountType} />
      {user.accountType === 'PRESTADOR' && <ProviderProfile />}

      {user.accountType === 'PRESTADOR' && (
        <section className="section" id="meus-servicos">
          <h2>Meus serviços</h2>
          <p>Vincule categorias ao seu perfil e escolha quais aparecem para os clientes.</p>
          {error && <div className="alert" role="alert">{error}</div>}
          {message && <div className="notice" role="status">{message}</div>}

          <div className="dashboard-grid">
            <form className="card" onSubmit={vincularCategoria}>
              <h3>Com o que você trabalha?</h3>
              <p>Encontre sua profissão e adicione ao perfil. Você pode vincular várias áreas de atuação.</p>
              <label htmlFor="category-search">Buscar profissão ou serviço</label>
              <input id="category-search" placeholder="Ex: jardineiro, pedreiro, babá, eletricista..." value={categorySearch} onChange={(event) => { setCategorySearch(event.target.value); setCategoryId(''); }} maxLength={100} />
              <label htmlFor="category-select">Categoria</label>
              <select id="category-select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                <CategoryOptions categories={filteredCategories} emptyLabel={filteredCategories.length ? 'Selecione sua área de atuação' : 'Nenhuma profissão encontrada'} />
              </select>
              <p className="category-result-hint" role="status">{filteredCategories.length} {filteredCategories.length === 1 ? 'área disponível' : 'áreas disponíveis'} para adicionar.</p>
              <button className="btn btn-primary" disabled={busy || !categoryId}>Vincular categoria</button>
            </form>

          </div>

          <div className="card linked-card">
            <h3>Categorias vinculadas</h3>
            {linked.length === 0 ? <p>Nenhuma categoria vinculada ainda.</p> : (
              <ul className="linked-list">
                {linked.map((category) => (
                  <li key={category.id}>
                    <span>{category.name} <span className={`status status-${category.status.toLowerCase()}`}>{category.status === 'ATIVO' ? 'Ativa' : 'Inativa'}</span></span>
                    <button className="btn btn-outline" type="button" disabled={busy} onClick={() => alterarStatus(category, category.status === 'ATIVO' ? 'INATIVO' : 'ATIVO')}>
                      {category.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
