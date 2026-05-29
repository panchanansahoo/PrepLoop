import fs from 'fs';

const content = fs.readFileSync('backend/routes/user_utils_test.js', 'utf8');
const declarations = [...content.matchAll(/^(const|let|function|async function)\s+([a-zA-Z0-9_]+)\s*(=|\()/gm)];

const exportedNames = declarations.map(m => m[2]).filter(n => n !== 'router' && n !== 'PROFILE_COMPLETION_COIN_REWARD' && n !== 'upload'); // keep what's needed
console.log(exportedNames);
