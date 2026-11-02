const fs = require('fs');
const path = require('path');

const e2eDir = path.resolve(__dirname, '../e2e');
const flowsDir = path.join(e2eDir, 'flows');
const configPath = path.join(e2eDir, 'config.yaml');

console.log('--- Verifying Mobile E2E Flows & Config ---');

if (!fs.existsSync(configPath)) {
  console.error('❌ Missing e2e/config.yaml');
  process.exit(1);
}

const configContent = fs.readFileSync(configPath, 'utf8');
if (!configContent.includes('appId: com.preploop.mobile')) {
  console.error('❌ e2e/config.yaml missing correct appId');
  process.exit(1);
}
console.log('✓ Validated e2e/config.yaml');

if (!fs.existsSync(flowsDir)) {
  console.error('❌ Missing e2e/flows directory');
  process.exit(1);
}

const flowFiles = fs.readdirSync(flowsDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
if (flowFiles.length === 0) {
  console.error('❌ No E2E flow files found in e2e/flows');
  process.exit(1);
}

let validCount = 0;
for (const file of flowFiles) {
  const filePath = path.join(flowsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Basic structural validations for Maestro flows
  const hasAppId = content.includes('appId: com.preploop.mobile');
  const hasCommands = content.includes('launchApp') || content.includes('assertVisible') || content.includes('tapOn');

  if (!hasAppId || !hasCommands) {
    console.error(`❌ Invalid flow definition in ${file}`);
    process.exit(1);
  }

  console.log(`✓ Flow verified: ${file}`);
  validCount++;
}

console.log(`\n🎉 Successfully verified ${validCount} mobile E2E flows.`);

