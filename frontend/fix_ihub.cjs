const fs = require('fs');
const path = 'c:/Users/panch/Desktop/Preploop/frontend/src/pages/InterviewHub.css';
let css = fs.readFileSync(path, 'utf8');

const mapping = [
  [/(\.ihub-hero-title\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-hero-subtitle\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.55\)/g, '$1color: var(--color-text-secondary)'],
  [/(\.ihub-stat-pill\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/g, '$1background: var(--ihub-bg-pill)'],
  [/(\.ihub-stat-pill\s*\{[\s\S]*?)border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.08\)/g, '$1border: 1px solid var(--ihub-border)'],
  [/(\.ihub-stat-value\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-stat-label\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-section-title\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-section-subtitle\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.45\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-mode-card\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)/g, '$1background: var(--ihub-bg-card)'],
  [/(\.ihub-mode-card\s*\{[\s\S]*?)border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.07\)/g, '$1border: 1px solid var(--ihub-border)'],
  [/(\.ihub-mode-card:hover\s*\{[\s\S]*?)border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.14\)/g, '$1border-color: var(--ihub-border-hover)'],
  [/(\.ihub-mode-card:hover\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/g, '$1background: var(--ihub-bg-card-hover)'],
  [/(\.ihub-mode-title\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-mode-desc\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/g, '$1color: var(--color-text-secondary)'],
  [/(\.ihub-mode-meta\s*\{[\s\S]*?)border-top:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/g, '$1border-top: 1px solid var(--ihub-border)'],
  [/(\.ihub-mode-meta-item\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.4\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-tool-card\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)/g, '$1background: var(--ihub-bg-card)'],
  [/(\.ihub-tool-card\s*\{[\s\S]*?)border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.07\)/g, '$1border: 1px solid var(--ihub-border)'],
  [/(\.ihub-tool-card:hover\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/g, '$1background: var(--ihub-bg-card-hover)'],
  [/(\.ihub-tool-card:hover\s*\{[\s\S]*?)border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/g, '$1border-color: var(--ihub-border-hover)'],
  [/(\.ihub-tool-title\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-tool-desc\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.4\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-tool-arrow\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.25\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-tool-card:hover\s*\.ihub-tool-arrow\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-panel\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)/g, '$1background: var(--ihub-bg-card)'],
  [/(\.ihub-panel\s*\{[\s\S]*?)border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.07\)/g, '$1border: 1px solid var(--ihub-border)'],
  [/(\.ihub-panel-title\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-weakness-item\s*\+\s*\.ihub-weakness-item\s*\{[\s\S]*?)border-top:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/g, '$1border-top: 1px solid var(--ihub-border)'],
  [/(\.ihub-weakness-label\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-weakness-bar-track\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\)/g, '$1background: var(--ihub-bg-icon)'],
  [/(\.ihub-session-row\s*\+\s*\.ihub-session-row\s*\{[\s\S]*?)border-top:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/g, '$1border-top: 1px solid var(--ihub-border)'],
  [/(\.ihub-session-name\s*\{[\s\S]*?)color:\s*#fff/g, '$1color: var(--color-text-primary)'],
  [/(\.ihub-session-meta\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.4\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-empty\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.4\)/g, '$1color: var(--color-text-muted)'],
  [/(\.ihub-empty-icon\s*\{[\s\S]*?)background:\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/g, '$1background: var(--ihub-bg-icon)'],
  [/(\.ihub-empty-icon\s*\{[\s\S]*?)color:\s*rgba\(255,\s*255,\s*255,\s*0\.2\)/g, '$1color: var(--color-text-muted)']
];

let replacedCount = 0;
for (const [regex, replacement] of mapping) {
  css = css.replace(regex, (match, p1) => {
    replacedCount++;
    return replacement.replace('$1', p1);
  });
}

const vars = `
:root {
  --ihub-bg-card: rgba(255, 255, 255, 0.03);
  --ihub-bg-card-hover: rgba(255, 255, 255, 0.05);
  --ihub-bg-pill: rgba(255, 255, 255, 0.06);
  --ihub-bg-icon: rgba(255, 255, 255, 0.04);
  
  --ihub-border: rgba(255, 255, 255, 0.07);
  --ihub-border-hover: rgba(255, 255, 255, 0.14);
}

[data-theme="light"] {
  --ihub-bg-card: #ffffff;
  --ihub-bg-card-hover: #f9fafb;
  --ihub-bg-pill: #ffffff;
  --ihub-bg-icon: rgba(0, 0, 0, 0.04);
  
  --ihub-border: rgba(0, 0, 0, 0.08); 
  --ihub-border-hover: rgba(0, 0, 0, 0.15); 
}
`;

if (!css.includes('--ihub-bg-card')) {
  css = css.replace('/* ─── Interview Hub ─── */', '/* ─── Interview Hub ─── */\\n' + vars);
}

fs.writeFileSync(path, css);
console.log('Replacements complete. Replaced classes:', replacedCount);
