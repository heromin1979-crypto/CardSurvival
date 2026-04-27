import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'tests/**/*.test.js',
      'testdata/hidden-element-*.test.mjs',
      'testdata/craft-discovery-*.test.mjs',
      'testdata/drop-handler-*.test.mjs',
    ],
  },
});
