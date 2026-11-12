// Bundles both handlers into dist/ with the same esbuild options the CDK stack uses.
import { build } from 'esbuild';

const root = new URL('..', import.meta.url).pathname;

for (const name of ['api', 'cognito']) {
  await build({
    entryPoints: [`${root}src/functions/${name}/handler.ts`],
    outfile: `${root}dist/${name}/index.js`,
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    sourcemap: true,
    tsconfig: `${root}tsconfig.json`,
    logLevel: 'warning',
  });
}
