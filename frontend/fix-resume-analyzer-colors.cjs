const fs = require('fs');
const file = 'c:/Users/panch/Desktop/Preploop/frontend/src/pages/ResumeAnalyzer.jsx';
let content = fs.readFileSync(file, 'utf8');

// Colors
content = content.replace(/:\s*'(#fff|#ffffff)'/g, ": 'var(--text-primary)'");
content = content.replace(/:\s*"(#fff|#ffffff)"/g, ': "var(--text-primary)"');
content = content.replace(/:\s*`(#fff|#ffffff)`/g, ': `var(--text-primary)`');

// Some ternaries: ? '#fff' : ... or : '#fff'
content = content.replace(/\?\s*'(#fff|#ffffff)'/g, "? 'var(--text-primary)'");
content = content.replace(/\:\s*'(#fff|#ffffff)'/g, ": 'var(--text-primary)'");

content = content.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.7\)'/g, "color: 'var(--text-secondary)'");
content = content.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.55\)'/g, "color: 'var(--text-muted)'");
content = content.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.25\)'/g, "color: 'var(--text-muted)'");
content = content.replace(/color="rgba\(255,\s*255,\s*255,\s*0\.25\)"/g, 'color="var(--text-muted)"');

// Backgrounds
content = content.replace(/background:\s*'rgba\(255,\s*255,\s*255,\s*0\.03\)'/g, "background: 'var(--bg-secondary)'");
content = content.replace(/background:\s*'rgba\(255,\s*255,\s*255,\s*0\.02\)'/g, "background: 'var(--bg-secondary)'");
content = content.replace(/background:\s*'rgba\(255,\s*255,\s*255,\s*0\.05\)'/g, "background: 'var(--bg-tertiary)'");

// Revert the preview background if it was changed
content = content.replace(/background:\s*'var\(--text-primary\)',\s*borderRadius:\s*4,\s*padding:\s*'40px 52px'/g, "background: '#ffffff', borderRadius: 4, padding: '40px 52px'");


fs.writeFileSync(file, content);
console.log('Replaced successfully part 2!');
