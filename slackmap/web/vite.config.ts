import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The live API and data, reached through localhost so the session cookie is localhost's own.
// The dev key gets a session without the browser check; `start` reads it from SSM.
const proxy = (target: string, prefix: string) => ({
  target,
  changeOrigin: true,
  rewrite: (path: string) => path.slice(prefix.length),
  cookieDomainRewrite: '',
  headers: { 'x-dev-key': process.env.SLACKMAP_DEV_KEY ?? '' },
});

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/_api': proxy('https://api.slackmap.com', '/_api'),
      '/_data': proxy('https://data.slackmap.com', '/_data'),
    },
  },
});
