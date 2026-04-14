import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '../routes');

const docs = {
  openapi: '3.0.0',
  info: {
    title: 'PrepLoop API',
    version: '1.0.0',
    description: 'Interview preparation platform API'
  },
  servers: [
    { url: 'http://localhost:5000/api', description: 'Development' }
  ],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log('📚 Generating API documentation...\n');

for (const file of routeFiles) {
  const routeName = file.replace('.js', '');
  console.log(`  - /${routeName}`);
  
  docs.paths[`/${routeName}`] = {
    get: {
      summary: `Get ${routeName} data`,
      tags: [routeName],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Success' },
        401: { description: 'Unauthorized' },
        500: { description: 'Server error' }
      }
    }
  };
}

const outputPath = path.join(__dirname, '../../docs/api-spec.json');
fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2));

console.log(`\n✅ API documentation generated: ${outputPath}`);
console.log('📖 View at: https://editor.swagger.io/');
