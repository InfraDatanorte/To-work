// A inicialização adiciona as categorias que faltam, sem alterar as existentes.
const { iniciarBanco, buscarUm, fecharBanco } = require('../src/database');
async function main() {
  try {
    await iniciarBanco();
    const result = await buscarUm('SELECT COUNT(*) AS total FROM categories');
    console.log(`Catálogo atualizado: ${result.total} categorias disponíveis.`);
  } finally {
    await fecharBanco();
  }
}
main().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
