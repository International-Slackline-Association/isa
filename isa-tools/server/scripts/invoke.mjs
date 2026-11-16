// pnpm run build && pnpm run invoke api GET /sheets/list/riggers -H origin:http://localhost
// pnpm run invoke api POST /v1/sign --client ID --scope isa-tools/documents.sign -d '{"subject":"s","expiresInSeconds":60,"content":"0123456789"}'
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    header: { type: 'string', short: 'H', multiple: true, default: [] },
    data: { type: 'string', short: 'd' },
    client: { type: 'string' },
    scope: { type: 'string' },
  },
});
const [name, method, target] = positionals;
if (!name || !method || !target) {
  console.error('usage: invoke api <METHOD> </path?query> [-H name:value] [-d body]');
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

// The /v1 endpoints are resources of their own, without a proxy, behind the app authorizer.
const isAppResource = url.pathname.startsWith('/v1/');
const event = {
  resource: isAppResource ? url.pathname : '/{proxy+}',
  httpMethod: method.toUpperCase(),
  path: url.pathname,
  pathParameters: isAppResource ? null : { proxy: url.pathname.slice(1) },
  requestContext: {
    authorizer: values.client
      ? { claims: { client_id: values.client, token_use: 'access', scope: values.scope ?? '' } }
      : null,
  },
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
