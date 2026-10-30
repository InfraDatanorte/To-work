/*
  database.js
  -----------------------------------------------------------------------------
  Este arquivo é a ponte entre o back-end e o banco SQLite.

  O SQLite salva os dados em um arquivo local:
  backend/data/to_work.sqlite

  Aqui ficam:
  - abertura do banco;
  - funções simples para executar SQL;
  - criação das tabelas;
  - criação das categorias iniciais.
*/

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const catalogoCategorias = require('./data/serviceCategories.json');
require('dotenv').config();

// Caminho do arquivo do banco. Vem do .env ou usa o caminho padrão.
const arquivoBanco = process.env.DATABASE_FILE || './data/to_work.sqlite';

// __dirname é a pasta atual: backend/src.
// O '..' sobe para backend/.
const caminhoBanco = path.resolve(__dirname, '..', arquivoBanco);
const pastaBanco = path.dirname(caminhoBanco);

// Se a pasta data/ não existir, o Node cria automaticamente.
if (!fs.existsSync(pastaBanco)) {
  fs.mkdirSync(pastaBanco, { recursive: true });
}

// Abre o arquivo SQLite. Se o arquivo não existir, o SQLite cria.
const db = new sqlite3.Database(caminhoBanco);
db.configure('busyTimeout', 5000);

// Conexão exclusiva: requisições simultâneas não misturam suas transações.
// ROLLBACK desfaz tudo quando uma das etapas falha.
async function transacao(operacao) {
  const conexao = new sqlite3.Database(caminhoBanco);
  conexao.configure('busyTimeout', 5000);
  const run = (sql, params = []) => new Promise((resolve, reject) => {
    conexao.run(sql, params, function (erro) {
      if (erro) reject(erro);
      else resolve({ id: this.lastID, alteracoes: this.changes });
    });
  });
  try {
    await run('PRAGMA foreign_keys = ON');
    await run('BEGIN IMMEDIATE');
    const resultado = await operacao(run);
    await run('COMMIT');
    return resultado;
  } catch (erro) {
    await run('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    await new Promise((resolve) => conexao.close(resolve));
  }
}

/*
  Função executar()
  -----------------------------------------------------------------------------
  Usada quando o SQL muda alguma coisa no banco.

  Exemplos:
  - CREATE TABLE
  - INSERT
  - UPDATE
  - DELETE

  Ela retorna:
  - id: ID do último registro criado;
  - alteracoes: quantidade de linhas alteradas.
*/
function executar(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, parametros, function (erro) {
      if (erro) {
        return reject(erro);
      }

      return resolve({
        id: this.lastID,
        alteracoes: this.changes
      });
    });
  });
}

/*
  Função buscarUm()
  -----------------------------------------------------------------------------
  Usada quando esperamos apenas um resultado.

  Exemplo:
  "Buscar um usuário pelo email".
*/
function buscarUm(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, parametros, (erro, linha) => {
      if (erro) {
        return reject(erro);
      }

      return resolve(linha);
    });
  });
}

/*
  Função buscarTodos()
  -----------------------------------------------------------------------------
  Usada quando esperamos uma lista de resultados.

  Exemplo:
  "Buscar todas as categorias".
*/
function buscarTodos(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, parametros, (erro, linhas) => {
      if (erro) {
        return reject(erro);
      }

      return resolve(linhas);
    });
  });
}

function fecharBanco() {
  return new Promise((resolve, reject) => db.close((erro) => erro ? reject(erro) : resolve()));
}

/*
  iniciarBanco()
  -----------------------------------------------------------------------------
  Esta função roda quando o servidor inicia.

  Ela cria as tabelas se elas ainda não existirem.
  Isso facilita a apresentação, porque o projeto já prepara o banco sozinho.
*/
async function iniciarBanco() {
  // Ativa as chaves estrangeiras no SQLite.
  // Isso faz os relacionamentos entre tabelas funcionarem corretamente.
  await executar('PRAGMA foreign_keys = ON');

  /*
    Tabela users
    ---------------------------------------------------------------------------
    Guarda os dados principais de qualquer usuário.

    Um usuário pode ser:
    - CLIENTE: pessoa que procura serviços;
    - PRESTADOR: pessoa que oferece serviços.
  */
  await executar(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK (account_type IN ('CLIENTE', 'PRESTADOR')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /*
    Tabela categories
    ---------------------------------------------------------------------------
    Guarda as categorias de serviço exibidas na Home.

    Exemplos:
    - Elétrica
    - Limpeza
    - Informática
  */
  await executar(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /*
    Tabela provider_profiles
    ---------------------------------------------------------------------------
    Guarda dados extras apenas dos usuários que são PRESTADORES.

    A tabela users guarda login e dados básicos.
    A tabela provider_profiles guarda dados profissionais.
  */
  await executar(`
    CREATE TABLE IF NOT EXISTS provider_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      phone TEXT,
      city TEXT,
      state TEXT,
      description TEXT,
      base_price REAL,
      rating REAL NOT NULL DEFAULT 0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  /*
    Tabela provider_categories
    ---------------------------------------------------------------------------
    Liga prestadores a categorias.

    Ela existe porque:
    - um prestador pode atuar em várias categorias;
    - uma categoria pode ter vários prestadores.

    Essa é uma relação muitos-para-muitos.
  */
  await executar(`
    CREATE TABLE IF NOT EXISTS provider_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (provider_id, category_id),
      FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Schema aditivo: novas tabelas sem apagar dados existentes.
  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await new Promise((resolve, reject) => db.exec(schema, (erro) => erro ? reject(erro) : resolve()));

  // Atualiza bancos criados antes da inclusão do status sem apagar vínculos.
  const colunasVinculo = await buscarTodos('PRAGMA table_info(provider_categories)');
  if (!colunasVinculo.some((coluna) => coluna.name === 'status')) {
    await executar("ALTER TABLE provider_categories ADD COLUMN status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO'))");
  }

  // Cadastros antigos de PRESTADOR também precisam de perfil para aparecer na Home.
  await executar(`
    INSERT OR IGNORE INTO provider_profiles (user_id, description)
    SELECT id, 'Prestador cadastrado na plataforma.'
    FROM users
    WHERE account_type = 'PRESTADOR'
  `);

  /*
    Categorias iniciais
    ---------------------------------------------------------------------------
    INSERT OR IGNORE significa:
    "insira se ainda não existir; se já existir, ignore".

    Isso evita duplicar categorias toda vez que a API inicia.
  */
  await transacao(async (run) => {
    for (const grupo of catalogoCategorias) {
      for (const categoria of grupo.items) {
        await run('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', categoria);
      }
    }
  });
}

module.exports = {
  executar,
  buscarUm,
  buscarTodos,
  iniciarBanco,
  fecharBanco,
  transacao
};
