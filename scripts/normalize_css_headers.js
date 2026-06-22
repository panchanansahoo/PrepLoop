#!/usr/bin/env node
// Normalize boxed Unicode headers in CSS files to simple ASCII comments

import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'frontend', 'src', 'pages');

function normalize(content) {
  // Replace box-style lines like /* ─── ... ─── */ with /* Section Name */
  return content.replace(/\/\*[^\n]*[\u2500-\u257F][^\n]*\*\//g, (match) => {
    // extract inner text between /* and */
    const inner = match.slice(2, -2).trim();
    // remove non-ASCII chars and collapse separators into a single space
    const cleaned = inner.replace(/[^\x00-\x7F]+/g, ' ').replace(/[-_\u2014\u2013\s]+/g, ' ').trim();
    const label = cleaned || 'Section';
    return `/* ${label} */`;
  });
}

function processFile(file) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = normalize(content);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.css'));
let changed = [];
for (const f of files) {
  try {
    if (processFile(f)) changed.push(f);
  } catch (e) {
    console.error('error', f, e.message);
  }
}

if (changed.length) {
  console.log('Normalized headers in:', changed.join(', '));
} else {
  console.log('No changes needed');
}
