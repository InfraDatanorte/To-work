// A API valida os dados mesmo quando o formulário já os validou.
function texto(value, max = 300) {
  return typeof value === 'string' && value.trim().length <= max ? value.trim() : null;
}
function idValido(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}
function centavos(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1000000) return null;
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 0.000001 ? cents : null;
}
module.exports = { texto, idValido, centavos };
