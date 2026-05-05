import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 15000,
    hookTimeout: 10000,
    pool: 'forks',
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['middleware/**', 'routes/**', 'services/**', 'config/**'],
      exclude: ['node_modules/**', 'scripts/**'],
    },
  },
});
