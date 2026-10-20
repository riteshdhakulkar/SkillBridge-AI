import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Allow the HMR websocket onto a non-default port. Two instances of the
      // app on one machine otherwise fight over 24678, and the instance that
      // loses the race reloads the page on every navigation because its
      // websocket can never connect.
      ...(process.env.HMR_PORT && process.env.DISABLE_HMR !== 'true'
        ? { hmr: { port: Number(process.env.HMR_PORT) } }
        : { hmr: process.env.DISABLE_HMR !== 'true' }),
    },
  };
});
