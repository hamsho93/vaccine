import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database is optional - app works fine without it
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.log('⚠️  No database configured - running in stateless mode (recommended for privacy)');
}

// Only create database connection if DATABASE_URL is valid
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'your-neon-postgres-url') {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.log('⚠️  Running in development mode without database connection');
}

export { pool, db };