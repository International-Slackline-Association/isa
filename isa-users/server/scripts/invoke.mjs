// pnpm run build && pnpm run invoke api GET /user/details --sub <cognito sub> --username <cognito username> --email <email>
// pnpm run invoke api GET /verify/confirm-email?token=x
// Calls the built api handler like API Gateway would. Without --sub/--username/--email there are no authorizer claims,
// as on the /verify resource. Only the api handler is invocable here; the cognito trigger takes a Cognito event.
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    header: { type: 'string', short: 'H', multiple: true, default: [] },
    data: { type: 'string', short: 'd' },
    sub: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' },
  },
});
const [name, method, target] = positionals;
if (name !== 'api' || !method || !target) {
  console.error(
    'usage: invoke api <METHOD> </path?query> [-H name:value] [-d body] [--sub s] [--username u] [--email e]',
  );
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

const claims = { sub: values.sub, 'cognito:username': values.username, email: values.email };
const hasClaims = Object.values(claims).some((value) => value !== undefined);

// API Gateway has the unauthenticated /verify/{proxy+} resource next to the authorized /{proxy+}.
const resource = url.pathname.startsWith('/verify/') ? '/verify/{proxy+}' : '/{proxy+}';
const proxy = url.pathname.slice(resource.length - '{proxy+}'.length);

const event = {
  resource,
  httpMethod: method.toUpperCase(),
  path: url.pathname,
  pathParameters: { proxy },
  headers,
  queryStringParameters: Object.keys(query).length ? query : null,
  body: values.data ?? null,
  isBase64Encoded: false,
  requestContext: { authorizer: hasClaims ? { claims } : null },
};

const require = createRequire(import.meta.url);
const { main } = require(`../dist/${name}/index.js`);
const result = await main(event);
console.log(result.statusCode);
console.log(JSON.stringify(result.headers));
console.log(result.body);
