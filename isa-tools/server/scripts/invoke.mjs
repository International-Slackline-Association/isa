// Calls a built handler's `main` with an API Gateway proxy event and prints status and body.
// pnpm run build && pnpm run invoke api GET /sheets/list/riggers -H origin:http://localhost
// pnpm run invoke api POST /sign -H x-api-key:KEY -d '{"subject":"s","expiresInSeconds":60,"content":"0123456789"}'
// The handlers need AWS credentials (AWS_PROFILE, AWS_REGION) and the environment variables set in the CDK stack.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    header: { type: 'string', short: 'H', multiple: true, default: [] },
    data: { type: 'string', short: 'd' },
  },
});
const [name, method, target] = positionals;
if (!name || !method || !target) {
  console.error('usage: invoke <api|image-processor-api> <METHOD> </path?query> [-H name:value] [-d body]');
  process.exit(1);
}

const url = new URL(target, 'http://local');
const headers = Object.fromEntries(
  values.header.map((header) => {
    const [headerName, ...rest] = header.split(':');
    return [headerName.trim(), rest.join(':').trim()];
  }),
);
if (values.data !== undefined && !Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
  headers['content-type'] = 'application/json';
}
const query = Object.fromEntries(url.searchParams);

const event = {
  httpMethod: method.toUpperCase(),
  path: url.pathname,
  pathParameters: { proxy: url.pathname.replace(/^\/(image-processor\/)?/, '') },
  headers,
  queryStringParameters: Object.keys(query).length ? query : null,
  body: values.data ?? null,
  isBase64Encoded: false,
};

const require = createRequire(import.meta.url);
const { main } = require(`../dist/${name}/index.js`);
const result = await main(event);
console.log(result.statusCode);
console.log(result.body);
