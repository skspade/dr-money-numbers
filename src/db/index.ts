import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { Client } from 'pg';
import { sql } from '@vercel/postgres';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Global client instance for local development
let client: Client | null = null;
let dbInstance: Promise<NodePgDatabase<typeof schema>> | null = null;

// Create the database connection for Node.js runtime
const createNodeDb = async () => {
  try {
    // Create new client if it doesn't exist
    if (!client) {
      client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false,
        } : undefined,
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

// Create the database connection for Edge runtime
const createEdgeDb = () => drizzleVercel(sql, { schema });

// Get database instance based on runtime
export const getDb = async () => {
  // Check if we're in Edge runtime
  const isEdge = process.env.NEXT_RUNTIME === 'edge';

  if (isEdge) {
    return createEdgeDb();
  }

  if (!dbInstance) {
    dbInstance = createNodeDb() as Promise<NodePgDatabase<typeof schema>>;
  }
  return dbInstance;
};

// Export all schema objects
export * from './schema';
