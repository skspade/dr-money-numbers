import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set");
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL,
    ssl: false
  },
} satisfies Config; 