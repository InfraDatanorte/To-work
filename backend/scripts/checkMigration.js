// Confere a evolução em uma cópia do banco existente, sem alterar o original.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const sqlite3 = require('sqlite3');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'towork-migration-'));
const original = path.resolve(__dirname, '../data/to_work.sqlite');
const copy = path.join(temp, 'copy.sqlite');
process.env.DATABASE_FILE = copy;
async function main() {
  const source = new sqlite3.Database(original, sqlite3.OPEN_READONLY);
  try {
    await new Promise((resolve, reject) => {
      const backup = source.backup(copy);
      backup.step(-1, (erro) => {
        backup.finish((finishError) => erro || finishError ? reject(erro || finishError) : resolve());
      });
    });
  } finally { await new Promise((resolve) => source.close(resolve)); }
  const { buscarTodos, buscarUm, iniciarBanco, fecharBanco } = require('../src/database');
  try {
    const names = ['users', 'categories', 'provider_profiles', 'provider_categories'];
    const before = {};
    for (const name of names) before[name] = await buscarTodos(`SELECT * FROM ${name} ORDER BY id`);
    await iniciarBanco();
    const result = [];
    for (const name of names) {
      const after = await buscarTodos(`SELECT * FROM ${name} ORDER BY id`);
      const intact = before[name].every((row) => {
        const current = after.find((item) => item.id === row.id);
        return current && Object.entries(row).every(([key, value]) => current[key] === value);
      });
      if (!intact) throw new Error(`Dados antigos alterados: ${name}`);
      result.push({ table: name, before: before[name].length, after: after.length, existingRowsUnchanged: intact });
    }
    const integrity = await buscarUm('PRAGMA integrity_check');
    const foreignKeys = await buscarTodos('PRAGMA foreign_key_check');
    if (foreignKeys.length) throw new Error('Falha de integridade referencial na cópia.');
    const report = { date: '2026-10-30', source: 'cópia consistente do banco local existente', originalModified: false, tables: result, integrity, foreignKeyErrors: foreignKeys.length };
    const target = path.resolve(__dirname, '../../docs/evidencias/migracao.json');
    fs.writeFileSync(target, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await fecharBanco();
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
