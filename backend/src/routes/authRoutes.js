const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buscarUm, transacao } = require('../database');
const { jwtSecret } = require('../config');
const { texto } = require('../utils/validation');
const { rota } = require('../utils/http');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

function sessao(user) {
  return { user, token: jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' }) };
}
const camposUsuario = 'id, full_name AS fullName, email, account_type AS accountType, created_at AS createdAt';

router.post('/register', rota(async (req, res) => {
  const nome = texto(req.body?.fullName, 100);
  const email = texto(req.body?.email, 254)?.toLowerCase();
  const senha = req.body?.password;
  const tipo = req.body?.accountType;
  if (!nome || nome.length < 2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Informe nome de 2 a 100 caracteres e email válido.' });
  }
  // bcrypt considera somente 72 bytes: recusar evita senhas equivalentes.
  if (typeof senha !== 'string' || senha.length < 6 || Buffer.byteLength(senha) > 72) {
    return res.status(400).json({ message: 'Use uma senha de pelo menos 6 caracteres e até 72 bytes.' });
  }
  if (!['CLIENTE', 'PRESTADOR'].includes(tipo)) return res.status(400).json({ message: 'Tipo de conta inválido.' });
  if (await buscarUm('SELECT id FROM users WHERE LOWER(email) = ?', [email])) {
    return res.status(409).json({ message: 'Já existe uma conta com esse email.' });
  }
  const hash = await bcrypt.hash(senha, 10);
  const id = await transacao(async (run) => {
    const result = await run('INSERT INTO users (full_name, email, password_hash, account_type) VALUES (?, ?, ?, ?)', [nome, email, hash, tipo]);
    if (tipo === 'PRESTADOR') {
      await run('INSERT INTO provider_profiles (user_id, description) VALUES (?, ?)', [result.id, 'Novo prestador cadastrado na plataforma.']);
    }
    return result.id;
  });
  const user = await buscarUm(`SELECT ${camposUsuario} FROM users WHERE id = ?`, [id]);
  return res.status(201).json({ message: 'Conta criada com sucesso.', ...sessao(user) });
}));

router.post('/login', rota(async (req, res) => {
  const email = texto(req.body?.email, 254)?.toLowerCase();
  const senha = req.body?.password;
  if (!email || typeof senha !== 'string' || !senha || Buffer.byteLength(senha) > 72) {
    return res.status(400).json({ message: 'Informe email e senha válidos.' });
  }
  const usuario = await buscarUm(`SELECT ${camposUsuario}, password_hash, active FROM users WHERE LOWER(email) = ?`, [email]);
  if (!usuario || usuario.active !== 1 || !(await bcrypt.compare(senha, usuario.password_hash))) {
    return res.status(401).json({ message: 'Email ou senha inválidos.' });
  }
  const { password_hash, active, ...user } = usuario;
  return res.json(sessao(user));
}));

router.get('/me', authMiddleware, (req, res) => {
  const { active, ...user } = req.user;
  return res.json({ user });
});
module.exports = router;
