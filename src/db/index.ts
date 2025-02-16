import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Create the database connection
export const db = drizzle(sql, { schema });

// Export all schema objects
export * from './schema'; 