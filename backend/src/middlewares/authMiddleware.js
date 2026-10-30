/*
  authMiddleware.js
  -----------------------------------------------------------------------------
  Middleware é uma função que roda antes da rota final.

  Neste projeto, o authMiddleware funciona como um "porteiro":
  1. verifica se o front-end enviou token;
  2. valida se o token JWT é verdadeiro;
  3. busca o usuário no banco;
  4. libera a rota apenas se o usuário existir e estiver ativo.
*/

const jwt = require('jsonwebtoken');
const { buscarUm } = require('../database');
const { jwtSecret } = require('../config');

async function authMiddleware(req, res, next) {
  try {
    /*
      O front-end deve enviar o token assim:
      Authorization: Bearer TOKEN_AQUI
    */
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Token não enviado.' });
    }

    // Divide "Bearer TOKEN" em duas partes.
    const partes = authHeader.split(' ');
    const tipo = partes[0];
    const token = partes[1];

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    // jwt.verify valida assinatura e expiração do token.
    const dadosDoToken = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });

    // Mesmo com token válido, confirmamos se o usuário ainda existe e está ativo.
    const usuario = await buscarUm(
      `
        SELECT
          id,
          full_name AS fullName,
          email,
          account_type AS accountType,
          active,
          created_at AS createdAt
        FROM users
        WHERE id = ?
          AND active = 1
      `,
      [dadosDoToken.id]
    );

    if (!usuario) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo.' });
    }

    // Guardamos o usuário dentro da requisição.
    // A rota final poderá usar req.user.
    req.user = usuario;

    // next() significa: "está tudo certo, pode continuar para a rota final".
    return next();
  } catch (erro) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(erro.name)) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
    return next(erro);
  }
}

module.exports = authMiddleware;
