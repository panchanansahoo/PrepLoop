/**
 * OpenAPI Documentation Generator
 * Auto-generates Swagger/OpenAPI documentation from Express routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class APIDocGenerator {
  constructor() {
    this.spec = {
      openapi: '3.0.0',
      info: {
        title: 'PrepLoop API',
        version: '1.0.0',
        description: 'Comprehensive API documentation for PrepLoop interview preparation platform',
        contact: {
          name: 'PrepLoop Team',
          url: 'https://preploop.com',
        },
      },
      servers: [
        {
          url: process.env.BACKEND_URL || 'http://localhost:5000',
          description: 'Development server',
        },
        {
          url: 'https://api.preploop.com',
          description: 'Production server',
        },
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {},
      },
    };
  }

  /**
   * Generate documentation from routes directory
   */
  async generate() {
    const routesDir = path.join(__dirname, '../routes');
    const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'));

    for (const file of routeFiles) {
      await this.processRouteFile(path.join(routesDir, file), file);
    }

    return this.spec;
  }

  /**
   * Process individual route file
   */
  processRouteFile(filePath, fileName) {
    const routeName = fileName.replace('.js', '');
    const basePath = `/api/${routeName}`;

    // Common endpoints based on route patterns
    const endpoints = this.inferEndpoints(routeName);

    for (const endpoint of endpoints) {
      const fullPath = `${basePath}${endpoint.path}`;
      if (!this.spec.paths[fullPath]) {
        this.spec.paths[fullPath] = {};
      }

      this.spec.paths[fullPath][endpoint.method] = {
        tags: [routeName],
        summary: endpoint.summary,
        description: endpoint.description,
        security: endpoint.requiresAuth ? [{ bearerAuth: [] }] : [],
        parameters: endpoint.parameters || [],
        requestBody: endpoint.requestBody,
        responses: endpoint.responses || this.getDefaultResponses(),
      };
    }
  }

  /**
   * Infer common endpoints based on route name
   */
  inferEndpoints(routeName) {
    const commonPatterns = {
      auth: [
        {
          path: '/register',
          method: 'post',
          summary: 'Register new user',
          description: 'Create a new user account',
          requiresAuth: false,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string' },
                  },
                  required: ['email', 'password', 'name'],
                },
              },
            },
          },
        },
        {
          path: '/login',
          method: 'post',
          summary: 'User login',
          description: 'Authenticate user and return JWT token',
          requiresAuth: false,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
        },
      ],
      dsa: [
        {
          path: '/problems',
          method: 'get',
          summary: 'Get DSA problems',
          description: 'Retrieve list of DSA problems with filtering',
          requiresAuth: true,
          parameters: [
            { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['easy', 'medium', 'hard'] } },
            { name: 'pattern', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
        },
        {
          path: '/problems/:id',
          method: 'get',
          summary: 'Get problem by ID',
          description: 'Retrieve detailed information about a specific problem',
          requiresAuth: true,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
        },
        {
          path: '/submit',
          method: 'post',
          summary: 'Submit solution',
          description: 'Submit code solution for evaluation',
          requiresAuth: true,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    problemId: { type: 'string' },
                    code: { type: 'string' },
                    language: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp'] },
                  },
                  required: ['problemId', 'code', 'language'],
                },
              },
            },
          },
        },
      ],
      peerInterview: [
        {
          path: '/create',
          method: 'post',
          summary: 'Create peer interview room',
          description: 'Initializes a real-time collaborative coding room for peer practice',
          requiresAuth: true,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    problemId: { type: 'string' },
                    language: { type: 'string', default: 'javascript' },
                  },
                },
              },
            },
          },
        },
        {
          path: '/match',
          method: 'post',
          summary: 'Find peer match',
          description: 'Pairs user with a waiting candidate or initializes a waiting room',
          requiresAuth: true,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    language: { type: 'string' },
                    problemId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        {
          path: '/:roomCode/complete',
          method: 'post',
          summary: 'Complete peer interview',
          description: 'Submits rubric evaluation and awards peer champion badge',
          requiresAuth: true,
        },
      ],
      communityChallenges: [
        {
          path: '/current',
          method: 'get',
          summary: 'Get active weekly challenges',
          description: 'Retrieves current active community coding challenges and test cases',
          requiresAuth: false,
        },
        {
          path: '/:challengeId/submit',
          method: 'post',
          summary: 'Submit challenge solution',
          description: 'Validates code solution, increments weekly leaderboard score, and awards coins',
          requiresAuth: true,
        },
        {
          path: '/leaderboard',
          method: 'get',
          summary: 'Get community leaderboard',
          description: 'Fetches real-time weekly rank standings',
          requiresAuth: false,
        },
      ],
      employer: [
        {
          path: '/api-keys',
          method: 'post',
          summary: 'Generate API key',
          description: 'Issues a scoped platform API key for external ATS and screening bots',
          requiresAuth: true,
        },
        {
          path: '/webhooks',
          method: 'post',
          summary: 'Subscribe to webhooks',
          description: 'Registers HTTPS webhook URL for interview lifecycle events',
          requiresAuth: true,
        },
        {
          path: '/candidates',
          method: 'get',
          summary: 'List candidate assessments',
          description: 'Returns candidate screening pipeline and completed scores',
          requiresAuth: true,
        },
      ],
      jobs: [
        {
          path: '/search',
          method: 'get',
          summary: 'Search jobs',
          description: 'Search for job listings based on skills and location',
          requiresAuth: true,
          parameters: [
            { name: 'skills', in: 'query', schema: { type: 'string' } },
            { name: 'location', in: 'query', schema: { type: 'string' } },
            { name: 'experience', in: 'query', schema: { type: 'string' } },
          ],
        },
        {
          path: '/recommendations',
          method: 'get',
          summary: 'Get job recommendations',
          description: 'Get personalized job recommendations based on user profile',
          requiresAuth: true,
        },
      ],
    };

    return commonPatterns[routeName] || [
      {
        path: '',
        method: 'get',
        summary: `Get ${routeName}`,
        description: `Retrieve ${routeName} data`,
        requiresAuth: true,
      },
    ];
  }

  /**
   * Get default response schemas
   */
  getDefaultResponses() {
    return {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    };
  }

  /**
   * Save documentation to file
   */
  async save(outputPath = null) {
    const spec = await this.generate();
    const output = outputPath || path.join(__dirname, '../../docs/api-spec.json');
    
    fs.writeFileSync(output, JSON.stringify(spec, null, 2));
    console.log(`✅ API documentation generated: ${output}`);

    // Also generate HTML version
    await this.generateHTML(spec, output.replace('.json', '.html'));
  }

  /**
   * Generate HTML documentation
   */
  generateHTML(spec, outputPath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>PrepLoop API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(spec)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
    });
  </script>
</body>
</html>
    `;

    fs.writeFileSync(outputPath, html);
    console.log(`✅ HTML documentation generated: ${outputPath}`);
  }
}

// CLI execution
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const generator = new APIDocGenerator();
  generator.save().catch(console.error);
}

export default APIDocGenerator;
