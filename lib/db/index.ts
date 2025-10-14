import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { config, validateConfig } from '../config';

// Validate configuration on import
validateConfig();

// Use the database URL from configuration
const DB_URL = config.databaseUrl;

if (!DB_URL) {
  throw new Error('DATABASE_URL environment variable is required. Please check your app.config.js and .env files.');
}

// Create the connection
const sql = neon(DB_URL);
export const db = drizzle(sql, { schema });

// Export the schema for use in queries
export * from './schema';
export { sql };