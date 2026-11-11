let lambdaName: string | undefined;

const write = (level: string, message: string, data?: Record<string, unknown>) => {
  const meta = { lambdaName };
  const line = { message, level, meta, data, timestamp: new Date().toISOString() };
  process.stdout.write(JSON.stringify(line) + '\n');
};

export const logger = {
  setLambdaName: (name: string) => {
    lambdaName = name;
  },
  info: (message: string, data?: Record<string, unknown>) => write('info', message, data),
  error: (message: string, data?: Record<string, unknown>) => write('error', message, data),
};
