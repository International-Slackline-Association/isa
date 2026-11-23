// Read by vite.config too, so nothing here may touch the browser or import.meta.env.
export const stages = {
  prod: {
    domain: 'slackmap.com',
    webOrigins: ['https://slackmap.com', 'https://www.slackmap.com'],
    // Set by the app stack; changes only if the identity pool is recreated.
    uploadsIdentityPoolId: 'eu-central-1:3dc66cc0-5875-41b1-b83a-c17aa357a8d9',
    // Follows dataAccess.enforced in infra/lib/config.ts.
    sessionRequired: true,
    // The public half of the stage's pass signing key (see passes in infra/lib/config.ts). It sits in the public
    // source so anyone can check every member is signed with the same key, which is what keeps passes anonymous.
    passes: {
      perMonth: 10,
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtMDAxJxAFbyYGY3vkLnR
PAu3UrpPm6AP80I+H9AbuAoS01NAr+9QVDil92ax0jgucZiH4FirnCW6dYcdScEB
j2cTKrvztEWbwPDSoFv6/7YvBfbuVQfiltdYh0irGG0uu1DTzc3U1yKboRAhpa8c
6jmGSbxrPZBzjRJNoIzzSkvBO4qNDwi1R6g23mFcjdDHtLca4tWtXKJM3NCXPF4m
N/kWoF+TCFmHupIoka9E61SNbk3FNitVsmFDTEAXi2BUdNvyphCh6REyr/PYOsQh
3xpcTXSufZqRV9VrL1qmHZzQ23EHL9vQEzHMsZah/v4cUpkTU7ql5tU1nuzVqIts
CQIDAQAB
-----END PUBLIC KEY-----`,
    },
  },
  test: {
    domain: 'test.slackmap.com',
    webOrigins: ['https://test.slackmap.com'],
    uploadsIdentityPoolId: 'eu-central-1:a6c50e3f-113b-46bb-aa3a-4568454fb444',
    sessionRequired: false,
    passes: {
      perMonth: 50,
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsNIHjSacurqOintBkvI5
4DBlC0xfDB7zTfyb/TcOgIYD2F9YZMGyMtKL89vQCNUL9QyvDqC2oCjL43DUb7N4
R74hLWiXEEmH0AcQIS4nGZaK8TNRJCqkXqU82zpU6qXrgWWN6GK59HMY2BDELe7U
cnGIlA5vTNW1w7jjJeLDdw+QC4iwWsf3UBumhnsRORHHSMhkRTfQQqySE7Vo8AUl
CDaMqvdy6eeYBiD7lToOH8X70GXhif0u53K3I5AOnMSrlndSJtzxST83eA2CsGGR
lwWx4Y2O9MnakAwcgRjnnaHM6c9Ct0vRHYpfZM1Q3Zd8Xz5WxeZP/sleB4XjTN4+
AQIDAQAB
-----END PUBLIC KEY-----`,
    },
  },
};
export type Stage = keyof typeof stages;
export const isStage = (value: unknown): value is Stage => typeof value === 'string' && value in stages;
