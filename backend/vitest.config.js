import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/{unit,integration,smoke}/**/*.{test,spec}.{js,mjs,cjs,ts}'],
    exclude: ['node_modules', 'dist', 'scripts'],
    testTimeout: 15000,
  },
});
