const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function copyIfMissing(targetPath, templatePath, label) {
  if (fs.existsSync(targetPath)) {
    console.log(`[SKIP] ${label} already exists`);
    return false;
  }

  if (!fs.existsSync(templatePath)) {
    console.log(`[ERROR] Missing template: ${path.relative(process.cwd(), templatePath)}`);
    process.exitCode = 1;
    return false;
  }

  fs.copyFileSync(templatePath, targetPath);
  console.log(`[OK] Created ${label} from template`);
  return true;
}

function runVerificationIfRequested() {
  const shouldVerify = process.argv.includes('--verify');
  if (!shouldVerify) return;

  console.log('\nRunning setup verification...');
  const result = spawnSync(process.execPath, ['scripts/verifySetup.cjs'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const root = process.cwd();

  const backendEnv = path.join(root, 'backend', '.env');
  const backendTemplate = path.join(root, 'backend', '.env.example');
  const frontendEnv = path.join(root, 'frontend', '.env');
  const frontendTemplate = path.join(root, 'frontend', '.env.example');

  console.log('Bootstrapping local setup files...');

  const createdBackend = copyIfMissing(backendEnv, backendTemplate, 'backend/.env');
  const createdFrontend = copyIfMissing(frontendEnv, frontendTemplate, 'frontend/.env');

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }

  if (!createdBackend && !createdFrontend) {
    console.log('[INFO] No files were created. Setup files already present.');
  }

  console.log('Bootstrap complete.');
  console.log('Next: update placeholder values in backend/.env and frontend/.env');

  runVerificationIfRequested();
}

main();