import { useEffect, useState } from 'react';
import api from '../api/api.js';

export default function ProviderProfile() {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function carregar() {
    setError('');
    try {
      const { data } = await api.get('/provider/profile');
      setProfile(Object.fromEntries(Object.entries(data.profile).map(([k, v]) => [k, v ?? ''])));
    } catch { setError('Não foi possível carregar seu perfil.'); }
  }
  useEffect(() => { carregar(); }, []);
  function alterar(field, value) { setProfile({ ...profile, [field]: value }); }
  async function salvar(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await api.put('/provider/profile', { ...profile, basePrice: profile.basePrice === '' ? null : Number(profile.basePrice) });
      setMessage('Perfil atualizado. As informações já estão disponíveis na vitrine.');
    } catch (erro) { setError(erro.response?.data?.message || 'Não foi possível salvar o perfil.'); }
    finally { setBusy(false); }
  }
  return <section className="section" id="meu-perfil"><span className="eyebrow">APRESENTE O SEU TRABALHO</span><h2>Meu perfil profissional</h2><p>O telefone fica disponível ao cliente após o aceite do orçamento.</p>
    {error && <div className="alert" role="alert">{error}{!profile && <button className="link-button" onClick={carregar}>Tentar novamente</button>}</div>}
    {message && <div className="notice" role="status">{message}</div>}
    {!profile ? !error && <p role="status">Carregando perfil...</p> : <form className="card" onSubmit={salvar}>
      <div className="dashboard-grid"><div><label htmlFor="profile-city">Cidade</label><input id="profile-city" value={profile.city} onChange={(e) => alterar('city', e.target.value)} maxLength={100} required /></div>
        <div><label htmlFor="profile-state">UF</label><select id="profile-state" value={profile.state} onChange={(e) => alterar('state', e.target.value)} required><option value="">Selecione</option>{'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').map((uf) => <option key={uf}>{uf}</option>)}</select></div>
        <div><label htmlFor="profile-phone">Telefone (opcional)</label><input id="profile-phone" type="tel" value={profile.phone} onChange={(e) => alterar('phone', e.target.value)} maxLength={20} placeholder="(66) 99999-9999" /></div>
        <div><label htmlFor="profile-price">Preço inicial em R$ (opcional)</label><input id="profile-price" type="number" min="0.01" max="1000000" step="0.01" value={profile.basePrice} onChange={(e) => alterar('basePrice', e.target.value)} /></div></div>
      <label htmlFor="profile-description">Descrição profissional</label><textarea id="profile-description" value={profile.description} onChange={(e) => alterar('description', e.target.value)} maxLength={1000} required />
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar perfil'}</button>
    </form>}
  </section>;
}
