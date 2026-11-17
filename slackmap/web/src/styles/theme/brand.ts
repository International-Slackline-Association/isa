import tokens from '../../isa-brand/tokens.css?raw';

// MUI needs real color values.
const darkStart = tokens.indexOf('[data-theme="dark"]');
if (darkStart < 0) throw new Error('isa-brand tokens.css has no dark block to cut at');
const light = tokens.slice(0, darkStart);
const values = Object.fromEntries(
  [...light.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
);

const resolve = (value: string): string => {
  const reference = value.match(/^var\(--([\w-]+)\)$/);
  return reference ? resolve(values[reference[1]]) : value;
};

export const brand = (name: string) => {
  if (!values[name]) throw new Error(`isa-brand has no --${name}`);
  return resolve(values[name]);
};
