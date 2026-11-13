// pnpm run errorDigest [--live] [--days N]
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
await build({
  entryPoints: [`${root}src/scripts/errorDigest.ts`],
  outfile: `${root}dist/errorDigest/index.js`,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  tsconfig: `${root}tsconfig.json`,
  logLevel: 'warning',
});
const result = spawnSync('node', [`${root}dist/errorDigest/index.js`, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
