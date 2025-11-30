import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/DataFrame': 'src/core/DataFrame.ts',
    'columns/index': 'src/columns/index.ts',
    'io/index': 'src/io/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false, // Keep readable for debugging, can enable for production builds
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: `.js`,
    };
  },
});

