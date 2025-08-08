import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
      all: true,
      include: ['client/src/**/*', 'packages/my-shared-backend/server/**/*', 'shared/**/*', 'tests/**/*'],
      exclude: ['**/*.d.ts', 'node_modules/**', 'dist/**']
    }
  },
});