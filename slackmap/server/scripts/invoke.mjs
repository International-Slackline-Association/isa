// pnpm run build && pnpm run invoke api GET /country/CH/details
// pnpm run invoke api GET /line/<id>/details -H 'authorization: Bearer <jwt>'
// pnpm run invoke api POST /contact/sendUserMessage -H 'authorization: Bearer <jwt>' -d '{"recipient":...}'
// pnpm run invoke cronJob            runs the weekly refresh against whatever AWS the caller's credentials reach
// pnpm run invoke ddb-streams -d '<DynamoDB stream event JSON>'
// Calls the built handler like API Gateway (api: REST {proxy+} resource, no authorizer) or Lambda would.
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
const require = createRequire(import.meta.url);

if (name === 'cronJob' || name === 'ddb-streams') {
  const { main } = require(`../dist/${name}/index.js`);
  console.log(JSON.stringify(await main(values.data ? JSON.parse(values.data) : {})));
  process.exit(0);
}

if (name !== 'api' || !method || !target) {
  console.error('usage: invoke api <METHOD> </path?query> [-H name:value] [-d body] | invoke <cronJob|ddb-streams> [-d event]');
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
  pathParameters: { proxy: url.pathname.slice(1) },
  headers,
  queryStringParameters: Object.keys(query).length ? query : null,
  body: values.data ?? null,
  isBase64Encoded: false,
};

const { main } = require(`../dist/${name}/index.js`);
const result = await main(event);
console.log(result.statusCode);
console.log(JSON.stringify(result.headers));
console.log(result.body);
