const fs = require('fs');
const path = require('path');

// Patterns to remove (common mojibake fragments seen in repo)
const patterns = [
  /
  /
  /
  /
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p);
    } else if (/\.(js|jsx|ts|tsx|css|md)$/.test(e.name)) {
      try {
        let content = fs.readFileSync(p, 'utf8');
        let orig = content;
        for (const re of patterns) content = content.replace(re, '');
        if (content !== orig) {
          fs.writeFileSync(p, content, 'utf8');
          console.log('Cleaned:', p);
        }
      } catch (err) {
        console.error('Failed:', p, err.message);
      }
    }
  }
}

const root = path.resolve(__dirname, '..');
console.log('Scanning from', root);
walk(root);
console.log('Done');
