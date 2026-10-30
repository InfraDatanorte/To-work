const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'towork-test-'));
process.env.DATABASE_FILE = path.join(tempDir, 'test.sqlite');
process.env.JWT_SECRET = 'segredo-exclusivo-deste-teste';

const app = require('../src/app');
const { executar, buscarUm, buscarTodos, iniciarBanco, fecharBanco } = require('../src/database');

test('categorias, vínculos e prestadores existentes', async () => {
  let server;
  try {
    // Reproduz um banco anterior, cuja tabela de vínculos ainda não tinha status.
    await executar(`CREATE TABLE provider_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (provider_id, category_id)
    )`);
    await iniciarBanco();
    const catalogo = await buscarTodos('SELECT id, name FROM categories');
    assert.equal(catalogo.length, 152);
    for (const name of ['Jardinagem', 'Pedreiro', 'Babá', 'Costura e ajustes', 'Mecânica automotiva', 'Design gráfico', 'Idiomas']) {
      assert.ok(catalogo.some((item) => item.name === name), `Categoria ausente: ${name}`);
    }
    const coluna = await buscarUm("SELECT name FROM pragma_table_info('provider_categories') WHERE name = 'status'");
    assert.equal(coluna.name, 'status');

    await executar("INSERT INTO users (full_name, email, password_hash, account_type) VALUES ('Prestador antigo', 'antigo@teste.com', 'hash', 'PRESTADOR')");
    await iniciarBanco();
    assert.deepEqual(await buscarTodos('SELECT id, name FROM categories'), catalogo);
    assert.ok(await buscarUm("SELECT id FROM provider_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'antigo@teste.com')"));

    server = await new Promise((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function request(route, method = 'GET', body, token) {
      const response = await fetch(base + route, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      return { status: response.status, data: await response.json() };
    }

    const registered = await request('/auth/register', 'POST', {
      fullName: 'Maria Serviços', email: 'maria@teste.com', password: 'senha123', accountType: 'PRESTADOR'
    });
    assert.equal(registered.status, 201);
    const token = registered.data.token;
    const categoriasPublicas = (await request('/categories')).data.categories;
    assert.equal(categoriasPublicas.find((item) => item.name === 'Jardinagem').group, 'Jardim, campo e áreas externas');
    assert.match(categoriasPublicas.find((item) => item.name === 'Jardinagem').keywords, /Jardineiro/);

    const created = await request('/categories', 'POST', { name: 'Montagem', description: 'Montagem de móveis.' }, token);
    assert.equal(created.status, 201);
    const categoryId = created.data.category.id;
    assert.equal((await request('/categories')).data.categories.some((item) => item.id === categoryId), true);
    assert.equal((await request('/categories', 'POST', { name: 'montagem' }, token)).status, 409);

    assert.equal((await request('/provider/categories', 'POST', { categoryId }, token)).status, 201);
    let professionals = (await request('/professionals')).data.professionals;
    assert.equal(professionals.length, 2);
    assert.equal(professionals.find((item) => item.fullName === 'Maria Serviços').categoryNames, 'Montagem');
    assert.equal((await request('/provider/categories', 'GET', undefined, token)).data.categories.find((item) => item.id === categoryId).status, 'ATIVO');

    assert.equal((await request(`/provider/categories/${categoryId}`, 'PATCH', { status: 'INATIVO' }, token)).status, 200);
    professionals = (await request('/professionals')).data.professionals;
    assert.equal(professionals.find((item) => item.fullName === 'Maria Serviços').categoryNames, null);
    assert.equal((await request(`/provider/categories/${categoryId}`, 'PATCH', { status: 'INVALIDO' }, token)).status, 400);
    assert.equal((await request('/provider/categories', 'POST', { categoryId }, token)).status, 201);
    assert.equal((await request('/professionals')).data.professionals.find((item) => item.fullName === 'Maria Serviços').categoryNames, 'Montagem');

    const client = await request('/auth/register', 'POST', {
      fullName: 'Cliente', email: 'cliente@teste.com', password: 'senha123', accountType: 'CLIENTE'
    });
    assert.equal((await request('/categories', 'POST', { name: 'Outra' }, client.data.token)).status, 403);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await fecharBanco();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
