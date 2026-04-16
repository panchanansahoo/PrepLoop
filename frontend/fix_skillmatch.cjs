const fs = require('fs');
const path = 'c:/Users/panch/Desktop/Preploop/frontend/src/components/SkillMatchJobs.jsx';
let content = fs.readFileSync(path, 'utf8');

const mapping = [
  // color: white -> color: var(--color-text-primary, white)
  [/(color:\s*)white(;)/g, '$1var(--color-text-primary, white)$2'],
  [/(color:\s*)#fff(;)/g, '$1var(--color-text-primary, white)$2'],
  // company
  [/(color:\s*)rgba\(255,\s*255,\s*255,\s*0\.7\)(;)/g, '$1var(--color-text-secondary, rgba(255, 255, 255, 0.7))$2'],
  // placeholder
  [/(color:\s*)rgba\(255,\s*255,\s*255,\s*0\.4\)(;)/g, '$1var(--color-text-muted, rgba(255, 255, 255, 0.4))$2'],
  // backgrounds
  [/(background:\s*)rgba\(255,\s*255,\s*255,\s*0\.03\)(;)/g, '$1var(--smj-card-bg, rgba(255, 255, 255, 0.03))$2'],
  [/(background:\s*)rgba\(255,\s*255,\s*255,\s*0\.05\)(;)/g, '$1var(--smj-card-bg, rgba(255, 255, 255, 0.05))$2'],
  [/(background:\s*)rgba\(255,\s*255,\s*255,\s*0\.08\)(;)/g, '$1var(--smj-card-bg-hover, rgba(255, 255, 255, 0.08))$2'],
  [/(background:\s*)rgba\(255,\s*255,\s*255,\s*0\.1\)(;)/g, '$1var(--smj-btn-bg, rgba(255, 255, 255, 0.1))$2'],
  [/(background:\s*)rgba\(255,\s*255,\s*255,\s*0\.2\)(;)/g, '$1var(--smj-btn-bg, rgba(255, 255, 255, 0.2))$2'],
  [/(background:\s*)rgba\(255,\s*255,\s*255,\s*0\.3\)(;)/g, '$1var(--smj-btn-bg-hover, rgba(255, 255, 255, 0.3))$2'],
  // border colors
  [/(border:\s*[\w\s]+)rgba\(255,\s*255,\s*255,\s*0\.05\)(;)/g, '$1var(--smj-border, rgba(255, 255, 255, 0.05))$2'],
  [/(border:\s*[\w\s]+)rgba\(255,\s*255,\s*255,\s*0\.1\)(;)/g, '$1var(--smj-border, rgba(255, 255, 255, 0.1))$2'],
  [/(border:\s*[\w\s]+)rgba\(255,\s*255,\s*255,\s*0\.2\)(;)/g, '$1var(--smj-border, rgba(255, 255, 255, 0.2))$2'],
  [/(border:\s*[\w\s]+)rgba\(255,\s*255,\s*255,\s*0\.3\)(;)/g, '$1var(--smj-border, rgba(255, 255, 255, 0.3))$2'],
  [/(border-color:\s*)rgba\(255,\s*255,\s*255,\s*0\.15\)(;)/g, '$1var(--smj-border-hover, rgba(255, 255, 255, 0.15))$2'],
  [/(border-top:\s*[\w\s]+)rgba\(255,\s*255,\s*255,\s*0\.2\)(;)/g, '$1var(--smj-border, rgba(255, 255, 255, 0.2))$2'],
  [/(border-top-color:\s*)white(;)/g, '$1var(--color-text-primary, white)$2'],
];

let replacedCount = 0;
for (const [regex, replacement] of mapping) {
  content = content.replace(regex, (match, p1, p2) => {
    replacedCount++;
    return replacement.replace('$1', p1).replace('$2', p2);
  });
}

// Special button correction: the blue button add-skills-btn and skill-match-score should keep white text!
content = content.replace(/\.add-skills-btn \{[\s\S]*?\}/, (match) => {
  return match.replace(/color: var\(--color-text-primary, white\);/g, 'color: white;');
});
content = content.replace(/\.add-skills-btn-large \{[\s\S]*?\}/, (match) => {
  return match.replace(/color: var\(--color-text-primary, white\);/g, 'color: white;');
});
content = content.replace(/\.skill-match-score \{[\s\S]*?\}/, (match) => {
  return match.replace(/color: var\(--color-text-primary, white\);/g, 'color: white;');
});

// For .skill-match-apply-btn
content = content.replace(/\.skill-match-apply-btn \{[\s\S]*?\}/, (match) => {
  let inner = match.replace(/background: var\(--color-text-primary, white\);/g, 'background: var(--color-text-primary, white);');
  inner = inner.replace(/color:\s*#121212;/, 'color: var(--color-bg-primary, #121212);');
  return inner;
});

// Fix color of meta tags (icons specifically, or text)
content = content.replace(/\.skill-match-job-meta \{[\s\S]*?\}/, (match) => {
  if (!match.includes('color:')) {
    return match.replace('margin-bottom: 10px;', 'margin-bottom: 10px;\\n          color: var(--color-text-primary);');
  }
  return match;
});

// Append light mode CSS variables block just before the first @media query
const lightThemeVars = `
        :global([data-theme="light"]) .skill-match-jobs,
        [data-theme="light"] .skill-match-jobs {
          --smj-border: rgba(0, 0, 0, 0.1);
          --smj-border-hover: rgba(0, 0, 0, 0.2);
          --smj-btn-bg: rgba(0, 0, 0, 0.05);
          --smj-btn-bg-hover: rgba(0, 0, 0, 0.1);
          --smj-card-bg: rgba(0, 0, 0, 0.02);
          --smj-card-bg-hover: rgba(0, 0, 0, 0.05);
        }

`;
if (!content.includes('--smj-border')) {
  content = content.replace(/@media \(max-width: 960px\)/, lightThemeVars + '        @media (max-width: 960px)');
}

fs.writeFileSync(path, content);
console.log('Fixed SkillMatchJobs.jsx. Replacements:', replacedCount);
