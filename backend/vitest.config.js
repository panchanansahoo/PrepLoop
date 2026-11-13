import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/{unit,integration,smoke,security}/**/*.{test,spec}.{js,mjs,cjs,ts}'],
    exclude: ['node_modules', 'dist', 'scripts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: ['node_modules', 'dist', 'scripts', 'tests', 'types'],
      thresholds: {
        lines: 35,
        branches: 30,
        functions: 45,
        statements: 35,
      },
    },
  },
});
