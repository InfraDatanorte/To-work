const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'towork-flow-'));
process.env.DATABASE_FILE = path.join(temp, 'test.sqlite');
process.env.JWT_SECRET = 'segredo-exclusivo-testes-fluxo';
const app = require('../src/app');
const { iniciarBanco, fecharBanco, buscarUm, executar, transacao } = require('../src/database');
let server, base, provider, client, other, categoryId, providerId;
async function req(route, method = 'GET', body, token) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function register(email, accountType = 'CLIENTE') {
  const r = await req('/auth/register', 'POST', { fullName: accountType === 'PRESTADOR' ? 'Maria Serviços' : 'João Cliente', email, password: 'senha123', accountType });
  assert.equal(r.status, 201);
  return r.data;
}
async function novoPedido() {
  const r = await req('/requests', 'POST', { providerId, categoryId, title: 'Reparar tomada', description: 'Tomada da cozinha sem funcionar.', city: 'Sinop' }, client.token);
  assert.equal(r.status, 201);
  return r.data.id;
}
before(async () => {
  await iniciarBanco();
  server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
  provider = await register('prestador@teste.example', 'PRESTADOR');
  client = await register('cliente@teste.example');
  other = await register('outro@teste.example');
  categoryId = (await req('/categories')).data.categories.find((c) => c.name === 'Elétrica').id;
  await req('/provider/categories', 'POST', { categoryId }, provider.token);
  providerId = (await buscarUm('SELECT id FROM provider_profiles WHERE user_id = ?', [provider.user.id])).id;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await fecharBanco();
  fs.rmSync(temp, { recursive: true, force: true });
});

test('cadastro e autenticação validam tipos, email, hash e expiração', async () => {
  for (const fields of [{ email: 'invalido' }, { fullName: {} }, { password: {} }, { password: 'a'.repeat(73) }, { accountType: 'ADMIN' }]) {
    assert.equal((await req('/auth/register', 'POST', { fullName: 'Teste', email: 'novo@teste.example', password: 'senha123', accountType: 'CLIENTE', ...fields })).status, 400);
  }
  assert.equal((await req('/auth/register', 'POST', { fullName: 'Teste', email: ' CLIENTE@TESTE.EXAMPLE ', password: 'senha123', accountType: 'CLIENTE' })).status, 409);
  assert.equal((await req('/auth/login', 'POST', { email: client.user.email, password: 'errada' })).status, 401);
  assert.equal((await req('/auth/login', 'POST', { email: client.user.email, password: 'senha123' })).status, 200);
  const row = await buscarUm('SELECT password_hash FROM users WHERE id = ?', [client.user.id]);
  assert.notEqual(row.password_hash, 'senha123');
  assert.equal(client.user.password_hash, undefined);
  assert.equal((await req('/auth/me')).status, 401);
  assert.equal((await req('/auth/me', 'GET', undefined, jwt.sign({ id: client.user.id }, process.env.JWT_SECRET, { expiresIn: -1 }))).status, 401);
  assert.equal((await req('/auth/me', 'GET', undefined, client.token)).status, 200);
});

test('perfil, busca sem acentos, categoria inativa e privacidade pública', async () => {
  const profile = { city: 'Sinop', state: 'MT', description: 'Manutenção elétrica residencial', phone: '(66) 99999-9999', basePrice: 120.5 };
  assert.equal((await req('/provider/profile', 'PUT', profile, provider.token)).status, 200);
  assert.equal((await req('/provider/profile', 'PUT', profile, client.token)).status, 403);
  assert.equal((await req('/provider/profile', 'PUT', { ...profile, basePrice: -1 }, provider.token)).status, 400);
  let r = await req(`/professionals?q=eletrica&city=sinop&categoryId=${categoryId}`);
  assert.equal(r.data.professionals.length, 1);
  assert.equal(r.data.professionals[0].email, undefined);
  assert.equal(r.data.professionals[0].phone, undefined);
  assert.equal((await req('/professionals?q=nada')).data.professionals.length, 0);
  assert.equal((await req('/professionals?q=eletricista')).data.professionals.length, 1);
  assert.equal((await req('/professionals?categoryId=abc')).status, 400);
  await req(`/provider/categories/${categoryId}`, 'PATCH', { status: 'INATIVO' }, provider.token);
  assert.equal((await req(`/professionals?categoryId=${categoryId}`)).data.professionals.length, 0);
  assert.equal((await req('/requests', 'POST', { providerId, categoryId, title: 'Teste', description: 'Teste', city: 'Sinop' }, client.token)).status, 409);
  await req('/provider/categories', 'POST', { categoryId }, provider.token);
});

test('fluxo completo: pedido, orçamento, aceite, conclusão e avaliação única', async () => {
  const id = await novoPedido();
  assert.equal((await req(`/requests/${id}/review`, 'POST', { rating: 5 }, client.token)).status, 409);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'CONCLUIDO' }, provider.token)).status, 409);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'ORCADO', amount: 0 }, provider.token)).status, 400);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'ORCADO', amount: 10.123 }, provider.token)).status, 400);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'ORCADO', amount: 150.5, message: 'Materiais incluídos' }, provider.token)).status, 200);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'ACEITO' }, client.token)).status, 200);
  let row = (await req('/requests', 'GET', undefined, client.token)).data.requests.find((r) => r.id === id);
  assert.equal(row.quoteCents, 15050);
  assert.equal(row.providerPhone, '(66) 99999-9999');
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'CONCLUIDO' }, provider.token)).status, 200);
  assert.equal((await req(`/requests/${id}/review`, 'POST', { rating: 6 }, client.token)).status, 400);
  assert.equal((await req(`/requests/${id}/review`, 'POST', { rating: 5, comment: 'Ótimo trabalho' }, client.token)).status, 201);
  assert.equal((await req(`/requests/${id}/review`, 'POST', { rating: 1 }, client.token)).status, 409);
  const profile = (await req(`/professionals/${providerId}`)).data;
  assert.equal(profile.professional.rating, 5);
  assert.equal(profile.professional.reviewsCount, 1);
  assert.equal(profile.reviews[0].comment, 'Ótimo trabalho');
});

test('pedidos de terceiros, papéis e estados finais são protegidos', async () => {
  const id = await novoPedido();
  assert.equal((await req('/requests', 'GET', undefined, other.token)).data.requests.length, 0);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'CANCELADO' }, other.token)).status, 404);
  assert.equal((await req(`/requests/${id}/review`, 'POST', { rating: 5 }, other.token)).status, 404);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'ORCADO', amount: 50 }, client.token)).status, 409);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'CANCELADO' }, client.token)).status, 200);
  assert.equal((await req(`/requests/${id}`, 'PATCH', { status: 'ORCADO', amount: 50 }, provider.token)).status, 409);
  assert.equal((await req('/requests', 'POST', {}, provider.token)).status, 403);
  assert.equal((await req('/requests', 'POST', {}, client.token)).status, 400);
  const recusadoPrestador = await novoPedido();
  assert.equal((await req(`/requests/${recusadoPrestador}`, 'PATCH', { status: 'RECUSADO' }, provider.token)).status, 200);
  assert.equal((await req(`/requests/${recusadoPrestador}`, 'PATCH', { status: 'ORCADO', amount: 50 }, provider.token)).status, 409);
  const recusadoCliente = await novoPedido();
  await req(`/requests/${recusadoCliente}`, 'PATCH', { status: 'ORCADO', amount: 50 }, provider.token);
  assert.equal((await req(`/requests/${recusadoCliente}`, 'PATCH', { status: 'ACEITO' }, provider.token)).status, 409);
  assert.equal((await req(`/requests/${recusadoCliente}`, 'PATCH', { status: 'RECUSADO' }, client.token)).status, 200);
  assert.equal((await req(`/requests/${recusadoCliente}/review`, 'POST', { rating: 5 }, client.token)).status, 409);
  assert.equal((await req('/requests/abc', 'PATCH', {}, client.token)).status, 400);
  assert.equal((await req('/professionals/999999')).status, 404);
  assert.equal((await req('/rota-inexistente')).status, 404);
});

test('decisões concorrentes aplicam somente uma transição', async () => {
  const id = await novoPedido();
  const result = await Promise.all([
    req(`/requests/${id}`, 'PATCH', { status: 'CANCELADO' }, client.token),
    req(`/requests/${id}`, 'PATCH', { status: 'RECUSADO' }, provider.token)
  ]);
  assert.deepEqual(result.map((r) => r.status).sort(), [200, 409]);
});

test('transação desfaz alterações se uma etapa falha', async () => {
  await assert.rejects(transacao(async (run) => {
    await run("INSERT INTO categories (name) VALUES ('Categoria para rollback')");
    await run('INSERT INTO tabela_inexistente VALUES (1)');
  }));
  assert.equal(await buscarUm("SELECT id FROM categories WHERE name = 'Categoria para rollback'"), undefined);
});

test('conta inativa perde acesso e JSON inválido recebe resposta controlada', async () => {
  await executar('UPDATE users SET active = 0 WHERE id = ?', [other.user.id]);
  assert.equal((await req('/requests', 'GET', undefined, other.token)).status, 401);
  const invalid = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalido' });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).message, 'JSON inválido.');
});
