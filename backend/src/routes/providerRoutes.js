const express = require('express');
const { executar, buscarUm, buscarTodos, transacao } = require('../database');
const { texto, centavos } = require('../utils/validation');
const { rota } = require('../utils/http');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

async function exigirPrestador(req, res, next) {
  if (req.user.accountType !== 'PRESTADOR') {
    return res.status(403).json({ message: 'Apenas prestadores podem gerenciar categorias.' });
  }

  try {
    const perfil = await buscarUm('SELECT id FROM provider_profiles WHERE user_id = ?', [req.user.id]);
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil de prestador não encontrado.' });
    }
    req.providerId = perfil.id;
    return next();
  } catch (erro) {
    console.error('Erro ao consultar perfil:', erro.message);
    return res.status(500).json({ message: 'Erro ao consultar perfil.' });
  }
}

// Restringe o middleware a estas rotas, preservando 404 para URLs desconhecidas.
router.use(['/categories', '/provider'], authMiddleware, exigirPrestador);

router.get('/provider/profile', rota(async (req, res) => {
  const profile = await buscarUm(`SELECT phone, city, state, description, base_price AS basePrice
    FROM provider_profiles WHERE id = ?`, [req.providerId]);
  return res.json({ profile });
}));

router.put('/provider/profile', rota(async (req, res) => {
  const phone = texto(req.body?.phone ?? '', 20);
  const city = texto(req.body?.city ?? '', 100);
  const state = texto(req.body?.state ?? '', 2)?.toUpperCase();
  const description = texto(req.body?.description ?? '', 1000);
  const basePrice = req.body?.basePrice;
  const ufs = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
  if (phone === null || (phone && !/^\+?[\d\s()-]{10,20}$/.test(phone)) || !city || !ufs.includes(state) || !description ||
      (basePrice !== null && basePrice !== undefined && centavos(basePrice) === null)) {
    return res.status(400).json({ message: 'Informe cidade, UF, descrição e telefone válido (opcional). O preço deve ser positivo e ter até 2 casas decimais.' });
  }
  await executar(`UPDATE provider_profiles SET phone = ?, city = ?, state = ?, description = ?, base_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [phone, city, state, description, basePrice ?? null, req.providerId]);
  return res.json({ message: 'Perfil atualizado.' });
}));

// Novas categorias passam a aparecer na lista pública da Home.
router.post('/categories', async (req, res) => {
  const name = texto(req.body?.name, 80);
  const description = texto(req.body?.description ?? '', 300);
  if (!name || description === null) {
    return res.status(400).json({ message: 'Informe um nome de até 80 caracteres e uma descrição de até 300 caracteres.' });
  }

  try {
    const existente = await buscarUm('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [name]);
    if (existente) {
      return res.status(409).json({ message: 'Essa categoria já existe.' });
    }
    const resultado = await transacao(async (run) => {
      const categoria = await run('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
      await run("INSERT INTO provider_categories (provider_id, category_id, status) VALUES (?, ?, 'ATIVO')", [req.providerId, categoria.id]);
      return categoria;
    });
    return res.status(201).json({ category: { id: resultado.id, name, description } });
  } catch (erro) {
    console.error('Erro ao criar categoria:', erro.message);
    return res.status(500).json({ message: 'Erro ao criar categoria.' });
  }
});

router.get('/provider/categories', async (req, res) => {
  try {
    const categories = await buscarTodos(`
      SELECT c.id, c.name, pc.status
      FROM provider_categories pc
      INNER JOIN categories c ON c.id = pc.category_id
      WHERE pc.provider_id = ?
      ORDER BY c.name ASC
    `, [req.providerId]);
    return res.json({ categories });
  } catch (erro) {
    console.error('Erro ao listar vínculos:', erro.message);
    return res.status(500).json({ message: 'Erro ao listar vínculos.' });
  }
});

router.post('/provider/categories', async (req, res) => {
  const categoryId = Number(req.body?.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
    return res.status(400).json({ message: 'Categoria inválida.' });
  }

  try {
    const categoria = await buscarUm('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }
    await executar(`
      INSERT INTO provider_categories (provider_id, category_id, status)
      VALUES (?, ?, 'ATIVO')
      ON CONFLICT(provider_id, category_id) DO UPDATE SET status = 'ATIVO'
    `, [req.providerId, categoryId]);
    return res.status(201).json({ categoryId, status: 'ATIVO' });
  } catch (erro) {
    console.error('Erro ao vincular categoria:', erro.message);
    return res.status(500).json({ message: 'Erro ao vincular categoria.' });
  }
});

router.patch('/provider/categories/:categoryId', async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const status = req.body?.status;
  if (!Number.isSafeInteger(categoryId) || categoryId < 1 || !['ATIVO', 'INATIVO'].includes(status)) {
    return res.status(400).json({ message: 'Categoria ou status inválido.' });
  }

  try {
    const resultado = await executar(`
      UPDATE provider_categories SET status = ?
      WHERE provider_id = ? AND category_id = ?
    `, [status, req.providerId, categoryId]);
    if (!resultado.alteracoes) {
      return res.status(404).json({ message: 'Vínculo não encontrado.' });
    }
    return res.json({ categoryId, status });
  } catch (erro) {
    console.error('Erro ao atualizar vínculo:', erro.message);
    return res.status(500).json({ message: 'Erro ao atualizar vínculo.' });
  }
});

module.exports = router;
