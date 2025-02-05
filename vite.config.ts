import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(
  {
    resolve: {
      alias: {
        '@@react-pipes/debug': path.resolve(
          __dirname,
          './src/packages/react-pipes/src/index.debug.ts',
        ),
        '@@react-pipes/connectors/redux': path.resolve(
          __dirname,
          './src/packages/react-pipes/src/index.connectors.redux.ts',
        ),
        '@@react-pipes': path.resolve(
          __dirname,
          './src/packages/react-pipes/src/index.ts',
        ),
        '@@es-pipes/debug': path.resolve(
          __dirname,
          './src/packages/es-pipes/src/index.debug.ts',
        ),
        '@@es-pipes/core': path.resolve(
          __dirname,
          './src/packages/es-pipes/src/index.core.ts',
        ),
        '@@es-pipes': path.resolve(
          __dirname,
          './src/packages/es-pipes/src/index.ts',
        ),
      },
    },
    plugins: [
      react(),
    ],
  }
);
