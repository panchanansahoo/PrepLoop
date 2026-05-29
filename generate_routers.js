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
        let k = j + 1;
        while (k < content.length && (content[k] === ' ' || content[k] === '\n' || content[k] === '\r' || content[k] === ')' || content[k] === ',' || content[k] === ';')) {
          if (content[k] === ';' || content[k] === ')') {
            endIndex = k + 1;
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

const routeGroups = {
  profile: [],
  dashboard: [],
  learning: [],
  quiz: [],
  productivity: []
};

for (const route of routes) {
  const p = route.name;
  if (p.startsWith('/profile') || p.startsWith('/portfolio/public') || p.startsWith('/settings') || p.startsWith('/preferences')) {
    routeGroups.profile.push(route);
  } else if (p.startsWith('/dashboard') || p.startsWith('/history') || p.startsWith('/progress') || p.startsWith('/daily-challenge')) {
    routeGroups.dashboard.push(route);
  } else if (p.startsWith('/learning-path') || p.startsWith('/learning-path/dsa') || p.startsWith('/learning-path/lld') || p.startsWith('/learning-path/hld')) {
    routeGroups.learning.push(route);
  } else if (p.startsWith('/quiz/') || p.startsWith('/quiz-leaderboard') || p.startsWith('/problem-leaderboard')) {
    routeGroups.quiz.push(route);
  } else if (p.startsWith('/todos') || p.startsWith('/calendar-events')) {
    routeGroups.productivity.push(route);
  } else {
    console.log(`Warning: Uncategorized route: ${p}`);
  }
}

let lastEnd = 0;
let nonRouteParts = [];
for (const r of routes) {
  nonRouteParts.push(content.substring(lastEnd, r.start));
  lastEnd = r.end;
}
nonRouteParts.push(content.substring(lastEnd));

const utilsContentOriginal = nonRouteParts.join('\n');

// Safely update relative imports
let utilsContentUpdated = utilsContentOriginal
  .replace(/from\s+['"]\.\.\/([^'"]+)['"]/g, 'from "../../$1"')
  .replace(/export default router;/g, '')
  .replace(/const router = express\.Router\(\);/g, '');

for (const groupName of Object.keys(routeGroups)) {
  const groupRoutes = routeGroups[groupName];
  if (groupRoutes.length === 0) continue;
  
  const fileContent = [
    utilsContentUpdated.trim(),
    '\nconst router = express.Router();\n',
    groupRoutes.map(r => r.content).join('\n\n'),
    '\nexport default router;\n'
  ].join('\n');
  
  fs.writeFileSync(`backend/routes/user/${groupName}.js`, fileContent);
  console.log(`Wrote ${groupName}.js with ${groupRoutes.length} routes.`);
}

const newUserJs = `import express from 'express';
import profileRoutes from './user/profile.js';
import dashboardRoutes from './user/dashboard.js';
import learningRoutes from './user/learning.js';
import quizRoutes from './user/quiz.js';
import productivityRoutes from './user/productivity.js';

const router = express.Router();

router.use(profileRoutes);
router.use(dashboardRoutes);
router.use(learningRoutes);
router.use(quizRoutes);
router.use(productivityRoutes);

export default router;
`;

fs.writeFileSync('backend/routes/user.js', newUserJs);
console.log('Wrote updated user.js');

