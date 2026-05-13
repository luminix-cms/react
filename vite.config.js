import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

import dts from 'vite-plugin-dts';

import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
    }
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'types',
    }),
  ],
  build: {
    lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies),
        'react/jsx-runtime',
      ],
    }
  }
});
