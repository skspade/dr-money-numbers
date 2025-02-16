import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const main = async () => {
  const databaseUrl = process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    
    // Reset the database completely
    console.log('Resetting database...');
    await client.query('BEGIN');
    try {
      // Terminate all connections to the database except our own
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = current_database()
          AND pid <> pg_backend_pid();
      `);

      // Drop and recreate the schema
      await client.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
        ALTER DATABASE "drmoneynumbers" SET search_path TO public;
      `);

      await client.query('COMMIT');
      console.log('Database reset successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    // Run migrations
    console.log('Running migrations...');
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main(); 