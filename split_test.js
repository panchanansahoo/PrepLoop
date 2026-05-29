import fs from 'fs';

const content = fs.readFileSync('backend/routes/user.js', 'utf8');

const routeMatches = [...content.matchAll(/router\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g)];

const routes = [];

for (let i = 0; i < routeMatches.length; i++) {
  const match = routeMatches[i];
  const name = match[2];
  const method = match[1];
  
  const startIndex = match.index;
  let braceCount = 0;
  let started = false;
  let endIndex = -1;
  
  for (let j = startIndex; j < content.length; j++) {
    if (content[j] === '{') {
      braceCount++;
      started = true;
    } else if (content[j] === '}') {
      braceCount--;
      if (started && braceCount === 0) {
        // find the closing ');'
        let k = j + 1;
        while (k < content.length && (content[k] === ' ' || content[k] === '\n' || content[k] === '\r' || content[k] === ')')) {
          if (content[k] === ')') {
            // Include potential semicolon
            if (content[k+1] === ';') {
              endIndex = k + 2;
            } else {
              endIndex = k + 1;
            }
            break;
          }
          k++;
        }
        if (endIndex === -1) endIndex = j + 1;
        break;
      }
    }
  }
  
  routes.push({
    name,
    method,
    start: startIndex,
    end: endIndex,
    content: content.substring(startIndex, endIndex)
  });
}

// Find the last route end to extract helpers at the bottom
const lastRouteEnd = Math.max(...routes.map(r => r.end));

console.log(`Found ${routes.length} routes.`);
routes.forEach(r => console.log(r.method, r.name, r.content.length));

// We'll gather everything that is NOT a route into a 'utils' part
let lastEnd = 0;
let nonRouteParts = [];
for (const r of routes) {
  nonRouteParts.push(content.substring(lastEnd, r.start));
  lastEnd = r.end;
}
nonRouteParts.push(content.substring(lastEnd));

const utilsContent = nonRouteParts.join('\n')
  .replace(/export default router;/g, '')
  .replace(/const router = express\.Router\(\);/g, '');

fs.writeFileSync('backend/routes/user_utils_test.js', utilsContent);
fs.writeFileSync('backend/routes/user_routes_test.json', JSON.stringify(routes.map(r => r.name)));

