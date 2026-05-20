const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.dirname(process.execPath);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const child = spawn(npmCommand, ['start'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: false,
  windowsHide: false,
});

child.on('error', (error) => {
  console.error('No se pudo iniciar la aplicacion:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});