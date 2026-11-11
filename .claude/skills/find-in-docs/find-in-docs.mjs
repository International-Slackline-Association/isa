#!/usr/bin/env node
// find-in-docs — browse/search the repo's docs catalog.
//
// The catalog is opt-in: any tracked .md file whose frontmatter has a non-empty
// `type` and `description` (see docs/documentation-system/frontmatter-spec.md).
// `status: deprecated` docs are hidden. This tool only points — it never prints
// doc bodies; read the files it points at.
//
//   find-in-docs <keywords…>        search title+description+path
//   find-in-docs --dir <path> [kw…] restrict to a subtree; bare --dir lists it,
//                                   plus the markdown there that is not in the catalog
//   find-in-docs --map              catalog overview by folder (default with no args)

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import path from 'node:path';
import matter from '@11ty/gray-matter';
import MiniSearch from 'minisearch';

const HIT_CAP = 15;
const BRANCH_CAP = 30;
const DESC_CAP = 140;
const TREE_DEPTH_CAP = 5;

const { values: opts, positionals: keywords } = parseArgs({
  options: { dir: { type: 'string' }, map: { type: 'boolean' } },
  allowPositionals: true,
});

// resolved from this file's own directory, so it works from any cwd
const repoRoot = execSync('git rev-parse --show-toplevel', {
  cwd: import.meta.dirname,
  encoding: 'utf8',
}).trim();

function loadCatalog() {
  // --others picks up not-yet-committed docs; --exclude-standard keeps .gitignore rules
  const files = execSync("git ls-files --cached --others --exclude-standard -- '*.md'", {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    // agent instruction files load on their own; they are not docs to list
    .filter((rel) => !/(^|\/)(CLAUDE|AGENTS)\.md$/.test(rel));
  const catalog = [];
  // markdown that exists but never joined the catalog — the legacy docs of an
  // unconverted scope. Listed by --dir only, so the agent knows they are there.
  const uncataloged = [];
  let unparseable = 0;
  for (const rel of files) {
    let raw;
    try {
      raw = readFileSync(path.join(repoRoot, rel), 'utf8');
    } catch {
      continue; // deleted in working tree
    }
    if (!raw.startsWith('---')) {
      uncataloged.push(rel);
      continue;
    }
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      unparseable++;
      uncataloged.push(rel);
      continue;
    }
    const fm = parsed.data;
    const type = typeof fm.type === 'string' ? fm.type.trim() : '';
    const description = typeof fm.description === 'string' ? fm.description.trim() : '';
    if (!type || !description) {
      uncataloged.push(rel);
      continue;
    }
    const status = typeof fm.status === 'string' ? fm.status.trim() : 'stable';
    if (status === 'deprecated') continue; // hidden on purpose, not uncataloged
    catalog.push({
      path: rel,
      type,
      description,
      status,
      title: typeof fm.title === 'string' ? fm.title.trim() : '',
    });
  }
  if (unparseable > 0) {
    console.error(`(skipped ${unparseable} file(s) with unparseable frontmatter)`);
  }
  return { catalog, uncataloged };
}

const clip = (s) => (s.length > DESC_CAP ? `${s.slice(0, DESC_CAP - 1)}…` : s);

// base: when set, paths print relative to it (the view header names the base)
function printDoc(doc, base = '') {
  const shown = base ? path.relative(base, doc.path) : doc.path;
  console.log(`${shown}  [${doc.type}]  ${clip(doc.description)}`);
}

const segments = (p) => (p === '' || p === '.' ? [] : p.split('/'));

function proximity(docPath, anchorSegs) {
  const docSegs = segments(path.dirname(docPath));
  let shared = 0;
  while (shared < docSegs.length && shared < anchorSegs.length && docSegs[shared] === anchorSegs[shared]) {
    shared++;
  }
  return shared;
}

const isIndex = (doc) =>
  doc.type.toLowerCase() === 'index' || path.basename(doc.path).toLowerCase() === 'readme.md';

// READMEs/indexes first, then by path — a branch listing is a place you browse.
function branchSort(a, b) {
  const ai = isIndex(a) ? 0 : 1;
  const bi = isIndex(b) ? 0 : 1;
  return ai - bi || a.path.localeCompare(b.path);
}

function underDir(catalog, dir) {
  const prefix = dir === '' ? '' : `${dir.replace(/\/+$/, '')}/`;
  return catalog.filter((d) => d.path.startsWith(prefix));
}

// A subfolder with its own README is a scope entry: one collapsed line, go one
// --dir deeper. A subfolder without one only groups docs, so its docs are listed
// inline; collapsing it would hide the very files the reader has to choose from.
function printFolderTree(catalog, dir, depth, base) {
  if (depth > TREE_DEPTH_CAP) return;
  const dirKey = dir === '' ? '.' : dir;
  const subs = new Map();
  for (const doc of underDir(catalog, dir)) {
    if (path.dirname(doc.path) === dirKey) continue;
    const sub = path.relative(dir, doc.path).split('/')[0];
    if (!subs.has(sub)) subs.set(sub, []);
    subs.get(sub).push(doc);
  }
  const pad = '  '.repeat(depth);
  for (const [sub, subDocs] of [...subs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const subDir = dir === '' ? sub : `${dir}/${sub}`;
    const readme = subDocs.find((d) => path.dirname(d.path) === subDir && isIndex(d));
    if (readme) {
      console.log(`${pad}${sub}/ — ${subDocs.length} doc(s) · ${clip(readme.description)}`);
      continue;
    }
    console.log(`${pad}${sub}/`);
    const direct = subDocs.filter((d) => path.dirname(d.path) === subDir).sort(branchSort);
    for (const doc of direct.slice(0, BRANCH_CAP)) {
      console.log(`${pad}  ${path.relative(base, doc.path)}  [${doc.type}]  ${clip(doc.description)}`);
    }
    if (direct.length > BRANCH_CAP) console.log(`${pad}  … ${direct.length - BRANCH_CAP} more`);
    printFolderTree(catalog, subDir, depth + 1, base);
  }
}

// Direct docs of the browsed level get full lines; everything deeper is folders.
function printBranch(catalog, dir) {
  const docs = underDir(catalog, dir);
  console.log(`docs under ${dir === '' ? '(repo root)' : `${dir}/`} — ${docs.length} doc(s):`);
  const dirKey = dir === '' ? '.' : dir;
  const direct = docs.filter((d) => path.dirname(d.path) === dirKey).sort(branchSort);
  for (const doc of direct.slice(0, BRANCH_CAP)) printDoc(doc, dir);
  if (direct.length > BRANCH_CAP) {
    console.log(`… ${direct.length - BRANCH_CAP} more`);
  }
  printFolderTree(catalog, dir, 1, dir);
}

// A bare --dir tells the agent what the catalog does not cover, so an unconverted
// scope reads as "legacy docs here" instead of "nothing here".
function printUncataloged(uncataloged, dir) {
  const prefix = dir === '' ? '' : `${dir.replace(/\/+$/, '')}/`;
  const rels = uncataloged
    .filter((rel) => rel.startsWith(prefix))
    .map((rel) => rel.slice(prefix.length))
    .sort((a, b) => a.localeCompare(b));
  if (rels.length === 0) return;
  const shown = rels.slice(0, BRANCH_CAP).join(', ');
  const rest = rels.length > BRANCH_CAP ? ` … ${rels.length - BRANCH_CAP} more` : '';
  console.log(`not in the catalog (no type/description): ${shown}${rest}`);
}

// Never return nothing: walk up from `dir` to the nearest ancestor that has docs.
function printNearestBranch(catalog, dir, reason) {
  let cur = dir;
  for (;;) {
    if (underDir(catalog, cur).length > 0) {
      console.log(reason);
      printBranch(catalog, cur);
      return;
    }
    if (cur === '') break;
    const parent = path.dirname(cur);
    cur = parent === '.' ? '' : parent;
  }
  console.log(`${reason}\nthe docs catalog is empty — no tracked .md file has \`type\` + \`description\` frontmatter yet`);
}

function printMap(catalog) {
  console.log(`docs catalog — ${catalog.length} doc(s). Search: find-in-docs <keywords…> [--dir <path>]`);
  printFolderTree(catalog, '', 1, '');
}

function search(catalog, terms, dir, anchorSegs) {
  const scope = underDir(catalog, dir);
  const ms = new MiniSearch({
    fields: ['title', 'description', 'path'],
    extractField: (doc, field) =>
      // path segments are words, not one token: aws-platform/docs/…
      field === 'path'
        ? doc.path.replace(/[/\-_.]/g, ' ')
        // backticks and `$` are symbols to the tokenizer, so `PGURI` would index
        // as one token with its backtick and never match a search for pguri
        : String(doc[field] ?? '').replace(/[^\p{L}\p{N}]+/gu, ' '),
    searchOptions: { boost: { title: 4, description: 2, path: 1 } },
  });
  ms.addAll(scope.map((doc, id) => ({ id, ...doc })));
  // fuzzy/prefix only on terms >3 chars: fractional fuzzy rounds UP, so a
  // 3-letter term ("aws") would match "as"/"was" across the whole catalog
  const hits = ms
    .search({
      combineWith: 'OR',
      queries: terms.map((t) => ({ queries: [t], fuzzy: t.length > 3 ? 0.2 : false, prefix: t.length > 3 })),
    })
    .map((r) => ({ doc: scope[r.id], score: r.score, prox: proximity(scope[r.id].path, anchorSegs) }))
    .sort((a, b) => b.score - a.score || b.prox - a.prox || a.doc.path.localeCompare(b.doc.path));

  if (hits.length === 0) {
    printNearestBranch(catalog, dir, `no match for "${terms.join(' ')}" — nearest docs instead:`);
    return;
  }
  printHitTree(catalog, hits.slice(0, HIT_CAP));
  if (hits.length > HIT_CAP) {
    console.log(`… ${hits.length - HIT_CAP} more`);
  }
}

// Hits render nested under their folder chain, each folder carrying its README
// description — the ancestors tell the agent whether a leaf is even relevant.
function printHitTree(catalog, hits) {
  const root = { dirs: new Map(), docs: [], best: 0 };
  for (const h of hits) {
    let node = root;
    let cur = '';
    for (const seg of segments(path.dirname(h.doc.path))) {
      cur = cur ? `${cur}/${seg}` : seg;
      if (!node.dirs.has(seg)) node.dirs.set(seg, { dir: cur, dirs: new Map(), docs: [], best: 0 });
      node = node.dirs.get(seg);
      node.best = Math.max(node.best, h.score);
    }
    node.docs.push(h);
  }
  const readmeDesc = (dir) =>
    catalog.find((d) => path.dirname(d.path) === dir && isIndex(d))?.description;
  const walk = (node, depth) => {
    node.docs.sort((a, b) => b.score - a.score);
    for (const { doc } of node.docs) {
      console.log(`${'  '.repeat(depth)}${path.basename(doc.path)}  [${doc.type}]  ${clip(doc.description)}`);
    }
    for (const child of [...node.dirs.values()].sort((a, b) => b.best - a.best)) {
      const desc = readmeDesc(child.dir);
      console.log(`${'  '.repeat(depth)}${path.basename(child.dir)}/${desc ? ` · ${clip(desc)}` : ''}`);
      walk(child, depth + 1);
    }
  };
  walk(root, 0);
}

const { catalog, uncataloged } = loadCatalog();
const dir = opts.dir ? path.relative(repoRoot, path.resolve(repoRoot, opts.dir)) : '';
const cwdRel = path.relative(repoRoot, process.cwd());
const anchorSegs = segments(opts.dir ? dir : cwdRel.startsWith('..') ? '' : cwdRel);
const terms = keywords.map((k) => k.toLowerCase()).filter(Boolean);

if (opts.map || (terms.length === 0 && !opts.dir)) {
  printMap(catalog);
} else if (terms.length === 0) {
  printBranch(catalog, dir);
  printUncataloged(uncataloged, dir);
} else {
  search(catalog, terms, dir, anchorSegs);
}
