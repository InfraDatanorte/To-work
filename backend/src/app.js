/*
  app.js
  -----------------------------------------------------------------------------
  Este arquivo monta a API com Express.

  Pense nele como a "recepção" do back-end:
  1. recebe as requisições;
  2. libera o acesso do front-end com CORS;
  3. ensina o Express a ler JSON;
  4. encaminha cada rota para o arquivo correto.
*/

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const requestRoutes = require('./routes/requestRoutes');

// Aqui nasce a aplicação Express.
// A variável "app" representa a API inteira.
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

/*
  CORS
  -----------------------------------------------------------------------------
  O front-end roda em uma porta, normalmente http://localhost:5173.
  O back-end roda em outra porta, normalmente http://localhost:3001.

  Como são origens diferentes, o navegador bloqueia a comunicação se a API não
  permitir. O cors() libera o front-end configurado no .env.
*/
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

/*
  express.json()
  -----------------------------------------------------------------------------
  Permite que o back-end leia dados JSON enviados pelo front-end.

  Exemplo de JSON enviado no login:
  {
    "email": "teste@email.com",
    "password": "123456"
  }

  Sem essa linha, o req.body ficaria vazio ou indefinido.
*/
app.use(express.json({ limit: '32kb' }));

// Limitador em memória, suficiente para uma instância de demonstração local.
const tentativas = new Map();
const limpeza = setInterval(() => {
  for (const [ip, value] of tentativas) if (value.until < Date.now()) tentativas.delete(ip);
}, 60000);
limpeza.unref();
app.use('/api/auth', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const agora = Date.now();
  let entrada = tentativas.get(req.ip);
  if (!entrada || entrada.until < agora) entrada = { count: 0, until: agora + 15 * 60000 };
  entrada.count += 1;
  tentativas.set(req.ip, entrada);
  if (entrada.count > 50) {
    res.setHeader('Retry-After', Math.ceil((entrada.until - agora) / 1000));
    return res.status(429).json({ message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' });
  }
  next();
});

/*
  Rotas públicas
  -----------------------------------------------------------------------------
  São rotas que qualquer visitante pode acessar, sem login.

  publicRoutes possui:
  GET /health
  GET /categories
  GET /professionals

  Como aqui usamos app.use('/api', publicRoutes), as rotas finais ficam:
  GET /api/health
  GET /api/categories
  GET /api/professionals
*/
app.use('/api', publicRoutes);

/*
  Rotas de autenticação
  -----------------------------------------------------------------------------
  São rotas ligadas a cadastro, login e usuário logado.

  authRoutes possui:
  POST /register
  POST /login
  GET /me

  Como aqui usamos app.use('/api/auth', authRoutes), as rotas finais ficam:
  POST /api/auth/register
  POST /api/auth/login
  GET /api/auth/me
*/
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);

// Cadastro de categorias e gestão dos vínculos do prestador autenticado.
app.use('/api', providerRoutes);

/*
  Rota não encontrada
  -----------------------------------------------------------------------------
  Se a requisição chegou até aqui, significa que nenhuma rota acima respondeu.
  Então devolvemos erro 404.
*/
app.use((req, res) => {
  return res.status(404).json({ message: 'Rota não encontrada.' });
});

app.use((erro, req, res, next) => {
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido.' });
  if (erro.type === 'entity.too.large') return res.status(413).json({ message: 'Dados enviados excedem o limite.' });
  if (erro.code === 'SQLITE_CONSTRAINT' && /UNIQUE/.test(erro.message)) {
    return res.status(409).json({ message: 'Esse registro já existe.' });
  }
  console.error('Erro na API:', erro.message);
  return res.status(500).json({ message: 'Não foi possível concluir a operação. Tente novamente.' });
});
module.exports = app;
