import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  return value ? parseInt(value, 10) : defaultValue;
}

export const config = {
  // Environment
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isDev: getEnv('NODE_ENV', 'development') === 'development',
  isProd: getEnv('NODE_ENV', 'development') === 'production',
  
  // Server
  port: getEnvNumber('PORT', 3001),
  host: getEnv('HOST', '0.0.0.0'),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  
  // Database
  databaseUrl: requireEnv('DATABASE_URL'),
  
  // JWT
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  
  // Storage
  storagePath: getEnv('STORAGE_PATH', './uploads'),
  maxFileSizeMb: getEnvNumber('MAX_FILE_SIZE_MB', 10),
  
  // AI
  geminiApiKey: getEnv('GEMINI_API_KEY', ''),
  geminiModel: getEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
  aiRateLimitPerMinute: getEnvNumber('AI_RATE_LIMIT_PER_MINUTE', 30),
  aiRateLimitPerDay: getEnvNumber('AI_RATE_LIMIT_PER_DAY', 1000),
  
  // Security
  bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
  rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100),
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
  
  // Logging
  logLevel: getEnv('LOG_LEVEL', 'info'),
};
