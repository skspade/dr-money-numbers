import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Global client instance for local development
let client: Client | null = null;

// Create the database connection
const createDb = async () => {
  try {
    // Create new client if it doesn't exist
    if (!client) {
      client = new Client({
        connectionString: process.env.POSTGRES_URL,
        native: false // Explicitly disable native bindings
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
let dbInstance: Promise<NodePgDatabase<typeof schema>> | null = null;

export const getDb = async () => {
  if (!dbInstance) {
    dbInstance = createDb() as Promise<NodePgDatabase<typeof schema>>;
  }
  return dbInstance;
};

// Export all schema objects
export * from './schema'; 