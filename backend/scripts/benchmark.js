// Medição local reproduzível. Não é um teste de carga ou comparação entre bancos.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'towork-bench-'));
process.env.DATABASE_FILE = path.join(temp, 'benchmark.sqlite');
process.env.JWT_SECRET = 'segredo-temporario-apenas-benchmark';
const { iniciarBanco, fecharBanco, transacao, buscarUm } = require('../src/database');
const app = require('../src/app');
async function main() {
  let server;
  try {
    await iniciarBanco();
    await transacao(async (run) => {
      for (let i = 0; i < 100; i++) {
        const user = await run("INSERT INTO users (full_name,email,password_hash,account_type) VALUES (?, ?, 'nao-utilizado', 'PRESTADOR')", [`Profissional ${i}`, `benchmark${i}@teste.example`]);
        const p = await run("INSERT INTO provider_profiles (user_id, city, state, description) VALUES (?, 'Sinop', 'MT', 'Manutenção elétrica')", [user.id]);
        await run("INSERT INTO provider_categories (provider_id, category_id) VALUES (?, (SELECT id FROM categories WHERE name = 'Elétrica'))", [p.id]);
      }
    });
    server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const results = [];
    for (const route of ['/health', '/professionals', '/professionals?q=eletrica&city=sinop']) {
      for (let i = 0; i < 5; i++) await (await fetch(base + route)).json();
      const times = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        const response = await fetch(base + route);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
        times.push(performance.now() - start);
      }
      times.sort((a, b) => a - b);
      results.push({ route, samples: 50, medianMs: +times[25].toFixed(2), p95Ms: +times[47].toFixed(2), maxMs: +times[49].toFixed(2) });
    }
    const sqlite = await buscarUm('SELECT sqlite_version() AS version');
    const report = { date: '2026-10-30', node: process.version, sqlite: sqlite.version, platform: `${os.platform()} ${os.release()}`, providers: 100, mode: 'HTTP local, sequencial, 5 aquecimentos e 50 amostras por rota; inclui leitura do JSON', results };
    const output = path.resolve(__dirname, '../../docs/evidencias/benchmark.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await fecharBanco();
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
