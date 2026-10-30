// Banco temporário exclusivo dos testes. Nunca usa backend/data/to_work.sqlite.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'towork-browser-'));
process.env.DATABASE_FILE = path.join(temp, 'browser.sqlite');
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
process.env.FRONTEND_URL = 'http://localhost:5187';
const { iniciarBanco, fecharBanco } = require('../backend/src/database');
const app = require('../backend/src/app');
iniciarBanco().then(() => {
  const server = app.listen(3107, 'localhost', () => console.log('API de testes em http://localhost:3107'));
  async function encerrar() {
    server.close(async () => {
      await fecharBanco();
      fs.rmSync(temp, { recursive: true, force: true });
      process.exit(0);
    });
  }
  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
}).catch((erro) => { console.error(erro.message); process.exit(1); });
