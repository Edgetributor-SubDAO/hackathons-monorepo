/**
 * Legacy config - use config/env.ts instead
 * @deprecated Use getEnvConfig() from config/env.ts
 */
import { getEnvConfig } from '../config/env';

export interface APIConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
  };
  apiKey: {
    secret: string;
  };
}

export function loadConfig(): APIConfig {
  const env = getEnvConfig();
  
  return {
    port: env.API_PORT,
    nodeEnv: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    jwt: {
      secret: env.JWT_SECRET,
    },
    apiKey: {
      secret: env.API_KEY_SECRET || 'change-this-secret',
    },
  };
}

export const config = loadConfig();

