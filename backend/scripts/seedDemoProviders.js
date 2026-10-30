const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { executar, buscarUm, iniciarBanco, fecharBanco } = require('../src/database');

const prestadores = [
  {
    name: 'Ana Souza (demo)',
    email: 'demo.ana.souza@towork.example',
    description: 'Limpeza residencial e organização de ambientes. Perfil de demonstração.',
    categories: ['Limpeza']
  },
  {
    name: 'Bruno Lima (demo)',
    email: 'demo.bruno.lima@towork.example',
    description: 'Instalações elétricas e pequenos reparos hidráulicos. Perfil de demonstração.',
    categories: ['Elétrica', 'Hidráulica']
  },
  {
    name: 'Carla Mendes (demo)',
    email: 'demo.carla.mendes@towork.example',
    description: 'Pintura de interiores e cuidados com jardins. Perfil de demonstração.',
    categories: ['Pintura', 'Jardinagem']
  },
  {
    name: 'Diego Rocha (demo)',
    email: 'demo.diego.rocha@towork.example',
    description: 'Suporte em computadores e redes. Perfil de demonstração.',
    categories: ['Informática']
  }
];

async function adicionarPrestadores() {
  try {
    await iniciarBanco();

    for (const prestador of prestadores) {
      const senhaAleatoria = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(senhaAleatoria, 10);
      await executar(`
        INSERT OR IGNORE INTO users (full_name, email, password_hash, account_type)
        VALUES (?, ?, ?, 'PRESTADOR')
      `, [prestador.name, prestador.email, passwordHash]);

      const usuario = await buscarUm('SELECT id, account_type FROM users WHERE email = ?', [prestador.email]);
      if (usuario.account_type !== 'PRESTADOR') {
        throw new Error(`O email ${prestador.email} já pertence a outra conta.`);
      }

      await executar('INSERT OR IGNORE INTO provider_profiles (user_id, description) VALUES (?, ?)', [usuario.id, prestador.description]);
      const perfil = await buscarUm('SELECT id FROM provider_profiles WHERE user_id = ?', [usuario.id]);

      for (const nomeCategoria of prestador.categories) {
        const categoria = await buscarUm('SELECT id FROM categories WHERE name = ?', [nomeCategoria]);
        if (!categoria) throw new Error(`Categoria não encontrada: ${nomeCategoria}`);
        await executar(`
          INSERT OR IGNORE INTO provider_categories (provider_id, category_id, status)
          VALUES (?, ?, 'ATIVO')
        `, [perfil.id, categoria.id]);
      }
    }

    console.log(`${prestadores.length} prestadores de demonstração disponíveis na Home.`);
  } finally {
    await fecharBanco();
  }
}

adicionarPrestadores().catch((erro) => {
  console.error('Erro ao carregar prestadores de demonstração:', erro.message);
  process.exitCode = 1;
});
