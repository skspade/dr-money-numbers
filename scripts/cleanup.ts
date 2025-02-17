import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  await client.connect();
  
  console.log('Cleaning up database...');
  
  try {
    await client.query('BEGIN');

    // Drop tables in order of dependencies
    const dropQueries = [
      // First drop tables with foreign key dependencies
      'DROP TABLE IF EXISTS "transaction" CASCADE;',
      'DROP TABLE IF EXISTS "category" CASCADE;',
      'DROP TABLE IF EXISTS "aiSetting" CASCADE;',
      'DROP TABLE IF EXISTS "account" CASCADE;',
      'DROP TABLE IF EXISTS "session" CASCADE;',
      'DROP TABLE IF EXISTS "verificationToken" CASCADE;',
      // Then drop the base tables
      'DROP TABLE IF EXISTS "users" CASCADE;',
      // Finally drop custom types
      'DROP TYPE IF EXISTS "target_frequency" CASCADE;'
    ];

    for (const query of dropQueries) {
      await client.query(query);
    }

    await client.query('COMMIT');
    console.log('Database cleanup completed!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cleanup failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Cleanup failed!');
  console.error(err);
  process.exit(1);
}); 