import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  test: {
    include: ['../tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
  },
}); 