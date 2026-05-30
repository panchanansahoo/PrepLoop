import fs from 'fs';
const data = JSON.parse(fs.readFileSync('eslint-temp.json', 'utf8'));
const errFiles = data.filter(f => f.messages.length > 0);
console.log('Files with errors:', errFiles.length);
console.log('Total errors:', errFiles.reduce((a, f) => a + f.errorCount + f.fatalErrorCount, 0));
for (const f of errFiles) {
  const errors = f.messages.filter(m => m.severity === 2);
  if (errors.length === 0) continue;
  console.log('\n' + f.filePath.replace(/\\/g, '/'));
  for (const m of errors) {
    console.log('  L' + m.line + ':' + m.column, m.ruleId, '-', m.message.slice(0, 80));
  }
}
