const crypto = require('node:crypto');
require('dotenv').config();
if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET || '').length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção.');
}
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') throw new Error('Configure JWT_SECRET em produção.');
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('JWT temporário de desenvolvimento: sessões expiram ao reiniciar a API.');
}
module.exports = { jwtSecret: process.env.JWT_SECRET };
