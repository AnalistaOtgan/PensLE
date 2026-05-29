import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'lan' ? [basicSsl()] : [])],
  server: {
    allowedHosts: ['desktop-kk5dpan.tail411a6a.ts.net']
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
}));
