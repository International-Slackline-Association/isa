import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { isStage, stages } from './src/stages.ts';

const stage = process.env.STAGE;
if (!isStage(stage)) throw new Error('STAGE must be prod or test');
const { domain } = stages[stage];

// The stage's live API and data, reached through localhost so the session cookie is localhost's own.
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
    'import.meta.env.VITE_APP_STAGE': JSON.stringify(stage),
  },
  server: {
    proxy: {
      '/_api': proxy(`https://api.${domain}`, '/_api'),
      '/_data': proxy(`https://data.${domain}`, '/_data'),
    },
  },
});
