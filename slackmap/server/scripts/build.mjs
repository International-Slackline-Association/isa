// The same esbuild options the CDK stack uses.
import { build } from 'esbuild';

const root = new URL('..', import.meta.url).pathname;

for (const name of ['api', 'cronJob', 'ddb-streams']) {
  await build({
    entryPoints: [`${root}src/functions/${name}/handler.ts`],
    outfile: `${root}dist/${name}/index.js`,
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'cjs',
    sourcemap: true,
    tsconfig: `${root}tsconfig.json`,
    // A native module, installed for the Lambda's platform at bundling time.
    external: ['sharp'],
    logLevel: 'warning',
  });
}
