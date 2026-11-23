// Read by vite.config too, so nothing here may touch the browser or import.meta.env.
export const stages = {
  prod: {
    domain: 'slackmap.com',
    webOrigins: ['https://slackmap.com', 'https://www.slackmap.com'],
    // Set by the app stack; changes only if the identity pool is recreated.
    uploadsIdentityPoolId: 'eu-central-1:3dc66cc0-5875-41b1-b83a-c17aa357a8d9',
  },
  test: {
    domain: 'test.slackmap.com',
    webOrigins: ['https://test.slackmap.com'],
    uploadsIdentityPoolId: 'eu-central-1:a6c50e3f-113b-46bb-aa3a-4568454fb444',
  },
};
export type Stage = keyof typeof stages;
export const isStage = (value: unknown): value is Stage => typeof value === 'string' && value in stages;
