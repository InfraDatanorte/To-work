/*
  server.js
  -----------------------------------------------------------------------------
  Este é o ponto de entrada do back-end.

  Quando rodamos "npm run dev" ou "npm start", este arquivo é executado.
  Ele faz duas coisas principais:
  1. inicia/cria o banco SQLite;
  2. liga a API Express na porta configurada.
*/

require('dotenv').config();

const app = require('./app');
const { iniciarBanco } = require('./database');

// PORT vem do .env. Se não existir, usa 3001.
const PORT = process.env.PORT || 3001;

async function iniciarServidor() {
  try {
    // Antes de ligar a API, garantimos que o banco e as tabelas existem.
    await iniciarBanco();

    // app.listen coloca o Express para escutar requisições HTTP.
    app.listen(PORT, () => {
      console.log(`API To Work rodando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error('Erro ao iniciar a API:', erro.message);
    process.exit(1);
  }
}

iniciarServidor();
