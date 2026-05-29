import fs from 'fs';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import _generate from '@babel/generator';
const generate = _generate.default;

const userFile = fs.readFileSync('../routes/user.js', 'utf-8');

const ast = parse(userFile, {
  sourceType: 'module',
  plugins: ['jsx']
});

const groups = {
  profile: ['/profile', '/portfolio/public/:slug', '/settings', '/preferences'],
  dashboard: ['/dashboard', '/history', '/progress', '/daily-challenge'],
  learning: ['/learning-paths', '/learning-path/dsa', '/learning-path/lld', '/learning-path/hld'],
  quiz: ['/quiz/attempt', '/quiz-leaderboard', '/problem-leaderboard'],
  productivity: ['/todos', '/calendar-events']
};

function matchesPrefix(path, prefixes) {
  for (let p of prefixes) {
    if (path === p || path.startsWith(p + '/')) {
      return true;
    }
  }
  return false;
}

const unassignedRoutes = [];
const groupNodes = {
  profile: [],
  dashboard: [],
  learning: [],
  quiz: [],
  productivity: []
};

// Find all top-level statements that are NOT `router.something`
const commonImports = [];

traverse(ast, {
  ExpressionStatement(path) {
    if (
      path.node.expression.type === 'CallExpression' &&
      path.node.expression.callee.type === 'MemberExpression' &&
      path.node.expression.callee.object.name === 'router'
    ) {
      const method = path.node.expression.callee.property.name;
      const args = path.node.expression.arguments;
      if (args.length > 0 && (args[0].type === 'StringLiteral' || args[0].type === 'TemplateLiteral')) {
        const routePath = args[0].value || args[0].quasis?.[0]?.value?.raw || '';
        let matched = false;
        for (const [groupName, prefixes] of Object.entries(groups)) {
          if (matchesPrefix(routePath, prefixes)) {
            groupNodes[groupName].push(path.node);
            matched = true;
            break;
          }
        }
        if (!matched) {
          console.log(`Unmatched route: ${method} ${routePath}`);
          unassignedRoutes.push(path.node);
        }
      }
    }
  }
});

// Create the new files
const baseAst = parse(userFile, { sourceType: 'module', plugins: ['jsx'] });
// We need to keep all imports and variable declarations at the top.
// We remove all `router.x` calls, and then insert only the ones for the specific group.

for (const [groupName, nodes] of Object.entries(groupNodes)) {
  const currentAst = parse(userFile, { sourceType: 'module', plugins: ['jsx'] });
  traverse(currentAst, {
    ExpressionStatement(path) {
      if (
        path.node.expression.type === 'CallExpression' &&
        path.node.expression.callee.type === 'MemberExpression' &&
        path.node.expression.callee.object.name === 'router'
      ) {
         path.remove();
      }
    }
  });

  // Now find the `export default router;` and insert the specific nodes right before it.
  traverse(currentAst, {
    ExportDefaultDeclaration(path) {
      if (path.node.declaration.name === 'router') {
        path.insertBefore(nodes);
      }
    }
  });

  const output = generate(currentAst, {}, userFile);
  fs.mkdirSync('../routes/user', { recursive: true });
  fs.writeFileSync(`../routes/user/${groupName}.js`, output.code);
  console.log(`Created ${groupName}.js with ${nodes.length} routes.`);
}

console.log('Unassigned routes length:', unassignedRoutes.length);
