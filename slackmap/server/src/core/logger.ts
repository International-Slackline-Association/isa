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
  debug: (message: string, data?: Record<string, unknown>) => write('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => write('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => write('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => write('error', message, data),
};
