const replace = require('@rollup/plugin-replace');
const typescript = require('@rollup/plugin-typescript');

module.exports = [
  {
    input: [
      'src/index.ts',
      'src/index.core.ts',
      'src/index.debug.ts',
    ],
    output: [
      {
        chunkFileNames: 'cjs/[name]-[hash].cjs.js',
        dir: './main',
        entryFileNames: 'cjs/[name].cjs.js',
        format: 'cjs',
      },
      {
        chunkFileNames: 'esm/[name]-[hash].esm.js',
        dir: './main',
        entryFileNames: 'esm/[name].esm.js',
        format: 'esm',
      },
    ],
    plugins: [
      replace(
        {
          exclude: 'node_modules/**',
          values: {
            'import.meta.env.DEV': 'true',
          },
        },
      ),
      replace(
        {
          exclude: 'node_modules/**',
          values: {
            'env-detect.main': 'env-detect.dev',
          },
        },
      ),
      typescript(
        {
          tsconfig: './tsconfig.lib.json',
        },
      ),
    ],
  },
];
