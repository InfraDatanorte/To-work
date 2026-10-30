const express = require('express');
const { executar, buscarUm, buscarTodos } = require('../database');
const auth = require('../middlewares/authMiddleware');
const { rota } = require('../utils/http');
const { texto, idValido, centavos } = require('../utils/validation');
const router = express.Router();
router.use(auth);

router.get('/', rota(async (req, res) => {
  const requests = await buscarTodos(`SELECT sr.id, sr.title, sr.description, sr.city, sr.status,
    sr.quote_cents AS quoteCents, sr.quote_message AS quoteMessage, sr.created_at AS createdAt,
    c.name AS categoryName, uc.full_name AS clientName, up.full_name AS providerName,
    r.rating AS reviewRating, r.comment AS reviewComment,
    CASE WHEN sr.status IN ('ACEITO', 'CONCLUIDO') THEN pp.phone ELSE NULL END AS providerPhone
    FROM service_requests sr JOIN categories c ON c.id = sr.category_id
    JOIN users uc ON uc.id = sr.client_id JOIN provider_profiles pp ON pp.id = sr.provider_id
    JOIN users up ON up.id = pp.user_id LEFT JOIN reviews r ON r.request_id = sr.id
    WHERE sr.client_id = ? OR pp.user_id = ? ORDER BY sr.id DESC`, [req.user.id, req.user.id]);
  return res.json({ requests });
}));

router.post('/', rota(async (req, res) => {
  if (req.user.accountType !== 'CLIENTE') return res.status(403).json({ message: 'Apenas clientes podem solicitar serviços.' });
  const { providerId, categoryId } = req.body || {};
  const title = texto(req.body?.title, 100);
  const description = texto(req.body?.description, 1500);
  const city = texto(req.body?.city, 100);
  if (!idValido(providerId) || !idValido(categoryId) || !title || !description || !city) {
    return res.status(400).json({ message: 'Preencha prestador, categoria, título, descrição e cidade válidos.' });
  }
  // INSERT ... SELECT confere a disponibilidade no mesmo comando que cria o pedido.
  const result = await executar(`INSERT INTO service_requests (client_id, provider_id, category_id, title, description, city)
    SELECT ?, pp.id, pc.category_id, ?, ?, ? FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id JOIN provider_categories pc ON pc.provider_id = pp.id
    WHERE pp.id = ? AND pc.category_id = ? AND pc.status = 'ATIVO' AND u.active = 1 AND u.account_type = 'PRESTADOR'`,
  [req.user.id, title, description, city, Number(providerId), Number(categoryId)]);
  if (!result.alteracoes) return res.status(409).json({ message: 'Este serviço não está disponível para o prestador.' });
  return res.status(201).json({ id: result.id, message: 'Solicitação enviada.' });
}));

// O servidor decide quem pode mudar cada estado. Esconder botões não basta.
router.patch('/:id', rota(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ message: 'Solicitação inválida.' });
  const pedido = await buscarUm(`SELECT sr.*, pp.user_id AS provider_user_id FROM service_requests sr
    JOIN provider_profiles pp ON pp.id = sr.provider_id WHERE sr.id = ?`, [Number(req.params.id)]);
  if (!pedido || (pedido.client_id !== req.user.id && pedido.provider_user_id !== req.user.id)) {
    return res.status(404).json({ message: 'Solicitação não encontrada.' });
  }
  const status = req.body?.status;
  const cliente = pedido.client_id === req.user.id;
  const permitidos = cliente
    ? { PENDENTE: ['CANCELADO'], ORCADO: ['ACEITO', 'RECUSADO', 'CANCELADO'] }
    : { PENDENTE: ['ORCADO', 'RECUSADO'], ACEITO: ['CONCLUIDO'] };
  if (!permitidos[pedido.status]?.includes(status)) return res.status(409).json({ message: 'Esta alteração não é permitida no estado atual.' });
  let cents = pedido.quote_cents;
  let message = pedido.quote_message;
  if (status === 'ORCADO') {
    cents = centavos(req.body?.amount);
    message = texto(req.body?.message ?? '', 1000);
    if (cents === null || message === null) return res.status(400).json({ message: 'Informe valor positivo de até R$ 1.000.000,00, com até 2 casas decimais.' });
  }
  // Comparar o estado na atualização impede duas decisões concorrentes divergentes.
  const result = await executar(`UPDATE service_requests SET status = ?, quote_cents = ?, quote_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = ?`, [status, cents, message, pedido.id, pedido.status]);
  if (!result.alteracoes) return res.status(409).json({ message: 'A solicitação foi alterada. Atualize a página.' });
  return res.json({ message: 'Solicitação atualizada.', status });
}));

router.post('/:id/review', rota(async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ message: 'Solicitação inválida.' });
  const rating = req.body?.rating;
  const comment = texto(req.body?.comment ?? '', 500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment === null) {
    return res.status(400).json({ message: 'Informe nota de 1 a 5 e comentário de até 500 caracteres.' });
  }
  const pedido = await buscarUm('SELECT id, status FROM service_requests WHERE id = ? AND client_id = ?', [Number(req.params.id), req.user.id]);
  if (!pedido) return res.status(404).json({ message: 'Solicitação não encontrada.' });
  if (pedido.status !== 'CONCLUIDO') return res.status(409).json({ message: 'Avalie somente um serviço concluído.' });
  await executar('INSERT INTO reviews (request_id, rating, comment) VALUES (?, ?, ?)', [pedido.id, rating, comment]);
  return res.status(201).json({ message: 'Avaliação registrada.' });
}));
module.exports = router;
