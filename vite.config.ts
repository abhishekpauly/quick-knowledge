import { defineConfig } from 'vite';

// Dev server for the demo page. This is NOT the library build.
// Each package builds itself via its own tsc — see packages/*/tsconfig.build.json.
export default defineConfig({
  root: 'demo',
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@in-app-training/sdk': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
      '@in-app-training/react': new URL(
        './packages/react/src/index.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
