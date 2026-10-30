// Express 4 precisa encaminhar erros async para o tratador de erros.
function rota(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
module.exports = { rota };
