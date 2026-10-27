import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // The lazily loaded Three.js diorama chunk is ~1 MB minified by design (ADR-0003).
  build: { chunkSizeWarningLimit: 1100 },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
