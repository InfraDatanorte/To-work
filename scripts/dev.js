// Uma única chamada inicia API e interface. Ctrl+C encerra os dois processos.
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const processos = [
  spawn(process.execPath, ['src/server.js'], { cwd: path.join(root, 'backend'), stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', 'localhost', '--strictPort'], { cwd: path.join(root, 'frontend'), stdio: 'inherit' })
];
let encerrando = false;
function encerrar(codigo = 0) {
  if (encerrando) return;
  encerrando = true;
  processos.forEach((p) => p.kill());
  process.exitCode = codigo;
}
processos.forEach((p) => {
  p.on('error', (erro) => { console.error(erro.message); encerrar(1); });
  p.on('exit', (code) => encerrar(code || 0));
});
process.on('SIGINT', () => encerrar());
process.on('SIGTERM', () => encerrar());
