import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { Client } from 'pg';
import { sql } from '@vercel/postgres';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Global client instance for local development
let client: Client | null = null;

// Create the database connection based on environment
const createDb = async () => {
  if (process.env.VERCEL) {
    return drizzleVercel(sql, { schema });
  }

  try {
    // Create new client if it doesn't exist
    if (!client) {
      client = new Client({
        connectionString: process.env.POSTGRES_URL,
      });
      // Connect to the database
      await client.connect();
    }
    
    return drizzle(client, { schema });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

// Initialize database connection
let dbInstance: Promise<NodePgDatabase<typeof schema> | ReturnType<typeof drizzleVercel>> | null = null;

export const getDb = async () => {
  if (!dbInstance) {
    dbInstance = Promise.resolve(createDb());
  }
  return dbInstance;
};

// Export all schema objects
export * from './schema'; 