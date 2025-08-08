import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      lines: 0.6,
      functions: 0.6,
      branches: 0.6,
      statements: 0.6,
      all: true,
      include: ['client/src/**/*', 'packages/my-shared-backend/server/**/*', 'shared/**/*', 'tests/**/*'],
      exclude: ['**/*.d.ts', 'node_modules/**', 'dist/**']
    }
  },
});