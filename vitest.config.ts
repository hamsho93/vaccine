import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 15,
        functions: 25,
        branches: 50,
        statements: 15,
      },
      all: true,
      include: ['packages/my-shared-backend/server/**/*', 'shared/**/*'],
      exclude: ['**/*.d.ts', 'node_modules/**', 'dist/**', '**/*.test.ts']
    }
  },
});