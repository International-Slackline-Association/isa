import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = dirname(fileURLToPath(import.meta.url));
const entries = ['tokens.css', 'fonts.css', 'fonts', 'logos', 'LICENSE'];
const args = process.argv.slice(2).filter((arg) => arg !== '--');
const [target, flag] = args;
const fullTarget = target ? resolve(target) : '';
const overlaps = (a, b) => a === b || a.startsWith(b + sep) || b.startsWith(a + sep);
if (
  !target ||
  args.length > 2 ||
  (flag !== undefined && flag !== '--check') ||
  basename(fullTarget) !== 'isa-brand' ||
  overlaps(fullTarget, source)
) {
  console.error("Usage: pull.mjs <an app's folder named isa-brand> [--check]");
  process.exit(1);
}

const walk = (root, path = root) =>
  !existsSync(path)
    ? []
    : statSync(path).isDirectory()
      ? readdirSync(path).flatMap((name) => walk(root, join(path, name)))
      : [relative(root, path)];

if (flag === '--check') {
  const paths = [...new Set([...entries.flatMap((entry) => walk(source, join(source, entry))), ...walk(fullTarget)])];
  const differ = paths.filter((path) => {
    const a = join(source, path);
    const b = join(fullTarget, path);
    return !existsSync(a) || !existsSync(b) || !readFileSync(a).equals(readFileSync(b));
  });
  differ.forEach((path) => console.log(`differs: ${path}`));
  console.log(differ.length ? `${differ.length} files differ from isa-brand` : 'up to date with isa-brand');
  process.exit(differ.length ? 1 : 0);
}

rmSync(fullTarget, { recursive: true, force: true });
entries.forEach((entry) => cpSync(join(source, entry), join(fullTarget, entry), { recursive: true }));
console.log(`pulled isa-brand into ${target}`);
