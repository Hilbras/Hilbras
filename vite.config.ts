import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Two builds, one output.
 *
 * The default build is the client bundle plus the HTML shell. `vite build --mode
 * ssr` compiles `src/entry-server.tsx` to a plain Node module, which the
 * prerender step imports to produce the static markup. Running them as two
 * builds rather than a custom plugin keeps the config readable and means the
 * SSR output never has to be understood by the client build.
 */
export default defineConfig(({ mode }) => {
  if (mode === 'ssr') {
    return {
      plugins: [react()],
      build: {
        ssr: 'src/entry-server.tsx',
        outDir: '.ssr',
        emptyOutDir: true,
        target: 'node22',
        minify: false,
        rollupOptions: {
          output: { entryFileNames: 'entry-server.mjs', format: 'es' },
        },
      },
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
    },
    build: {
      target: 'es2022',
      cssMinify: 'lightningcss',
    },
  };
});
