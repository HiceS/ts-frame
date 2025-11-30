import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false, // Keep readable for debugging, can enable for production builds
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: `.js`,
    };
  },
});

