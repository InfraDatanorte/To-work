const express = require('express');
const { buscarTodos, buscarUm } = require('../database');
const { rota } = require('../utils/http');
const { texto, idValido } = require('../utils/validation');
const router = express.Router();
const catalogoCategorias = require('../data/serviceCategories.json');
const gruposPorNome = new Map(catalogoCategorias.flatMap((grupo) => grupo.items.map(([name]) => [name, grupo.group])));
const termosPorNome = new Map(catalogoCategorias.flatMap((grupo) => grupo.items));

router.get('/health', rota(async (req, res) => {
  await buscarUm('SELECT 1');
  return res.json({ status: 'ok', message: 'API To Work funcionando.' });
}));
router.get('/categories', rota(async (req, res) => {
  const categories = await buscarTodos('SELECT id, name, description, created_at AS createdAt FROM categories ORDER BY name');
  return res.json({ categories: categories.map((category) => ({ ...category, group: gruposPorNome.get(category.name) || 'Outros serviços', keywords: termosPorNome.get(category.name) || '' })) });
}));

// Os dados de login e o telefone não são publicados na vitrine.
const selectPrestador = `SELECT pp.id, u.full_name AS fullName, pp.description,
  pp.city, pp.state, pp.base_price AS basePrice,
  COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r
    JOIN service_requests sr ON sr.id = r.request_id WHERE sr.provider_id = pp.id), 0) AS rating,
  (SELECT COUNT(*) FROM reviews r JOIN service_requests sr ON sr.id = r.request_id WHERE sr.provider_id = pp.id) AS reviewsCount,
  (SELECT GROUP_CONCAT(c.name, ', ') FROM provider_categories pc JOIN categories c ON c.id = pc.category_id
    WHERE pc.provider_id = pp.id AND pc.status = 'ATIVO') AS categoryNames
  FROM provider_profiles pp JOIN users u ON u.id = pp.user_id
  WHERE u.active = 1 AND u.account_type = 'PRESTADOR'`;

router.get('/professionals', rota(async (req, res) => {
  const q = texto(req.query.q ?? '', 100);
  const city = texto(req.query.city ?? '', 100);
  const categoryId = req.query.categoryId;
  if (q === null || city === null || (categoryId !== undefined && !idValido(categoryId))) {
    return res.status(400).json({ message: 'Filtros inválidos.' });
  }
  // Filtragem em JavaScript usa comparação sem acentos (ex.: eletrica -> Elétrica).
  // Adequada à base acadêmica; bases grandes devem paginar e filtrar no banco.
  let professionals = await buscarTodos(selectPrestador + ' ORDER BY rating DESC, u.full_name');
  const normalizar = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (q) professionals = professionals.filter((p) => {
    const termos = (p.categoryNames || '').split(', ').map((name) => termosPorNome.get(name) || '').join(' ');
    return normalizar(`${p.fullName} ${p.description} ${p.categoryNames || ''} ${termos}`).includes(normalizar(q));
  });
  if (city) professionals = professionals.filter((p) => normalizar(p.city).includes(normalizar(city)));
  if (categoryId) {
    const links = await buscarTodos("SELECT provider_id FROM provider_categories WHERE category_id = ? AND status = 'ATIVO'", [Number(categoryId)]);
    const ids = new Set(links.map((row) => row.provider_id));
    professionals = professionals.filter((p) => ids.has(p.id));
  }
  return res.json({ professionals });
}));

router.get('/professionals/:id', rota(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ message: 'Prestador inválido.' });
  const professional = await buscarUm(selectPrestador + ' AND pp.id = ?', [Number(req.params.id)]);
  if (!professional) return res.status(404).json({ message: 'Prestador não encontrado.' });
  const categories = await buscarTodos(`SELECT c.id, c.name FROM categories c JOIN provider_categories pc ON pc.category_id = c.id
    WHERE pc.provider_id = ? AND pc.status = 'ATIVO' ORDER BY c.name`, [professional.id]);
  const reviews = await buscarTodos(`SELECT r.id, r.rating, r.comment, r.created_at AS createdAt
    FROM reviews r JOIN service_requests sr ON sr.id = r.request_id WHERE sr.provider_id = ? ORDER BY r.id DESC`, [professional.id]);
  return res.json({ professional, categories, reviews });
}));
module.exports = router;
