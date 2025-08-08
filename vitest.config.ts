import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  test: {
    include: ['../tests/**/*.test.ts'],
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
      include: ['client/src/**/*', 'packages/my-shared-backend/server/**/*', 'shared/**/*'],
      exclude: ['**/*.d.ts', 'node_modules/**', 'dist/**']
    }
  },
}); 