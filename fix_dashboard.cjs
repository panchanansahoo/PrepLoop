const fs = require('fs');
const path = 'c:/Users/panch/Desktop/Preploop/frontend/src/pages/Dashboard.css';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\.dash-avatar \{([^}]*)color: var\(--text-primary\);/g, '.dash-avatar {$1color: #ffffff;');
content = content.replace(/\.btn-get-credits \{([^}]*)color: var\(--text-primary\);/g, '.btn-get-credits {$1color: #ffffff;');
content = content.replace(/background: var\(--text-primary\);\s*color: black;/g, 'background: var(--text-primary);\n  color: var(--text-invert);');
content = content.replace(/color: white;/g, 'color: var(--text-primary);'); 
fs.writeFileSync(path, content);
console.log('Fixed specific items');
