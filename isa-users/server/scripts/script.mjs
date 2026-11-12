// pnpm run script <name> [args]   runs src/scripts/<name>.ts locally with the caller's AWS credentials and env
// Needs ISA_USERS_TABLE, USERPOOL_ID, ISA_TOOLS_TRUSTED_SERVICE_API_KEY as the script requires, plus AWS_REGION.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const [name, ...args] = process.argv.slice(2);
const entry = `${root}src/scripts/${name}.ts`;
if (!name || !existsSync(entry)) {
  const names = readdirSync(`${root}src/scripts`)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.slice(0, -3));
  console.error(`usage: script <${names.join('|')}> [args]`);
  process.exit(1);
}

const outfile = `${root}dist/scripts/${name}.js`;
await build({
  stdin: {
    contents: `import run from './${name}'; run(process.argv.slice(2)).catch((error) => { console.error(error); process.exit(1); });`,
    resolveDir: `${root}src/scripts`,
    sourcefile: 'run.ts',
    loader: 'ts',
  },
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  tsconfig: `${root}tsconfig.json`,
  logLevel: 'warning',
});

process.exit(spawnSync(process.execPath, [outfile, ...args], { stdio: 'inherit' }).status ?? 1);
