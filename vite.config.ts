import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // The lazily loaded Three.js diorama chunk is ~1.25 MB minified by design (ADR-0003, plus post-processing in ADR-0009).
  build: { chunkSizeWarningLimit: 1300 },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
