import { Pool } from 'pg';

// `new Pool()` reads the standard PG* environment variables
// (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE). In Docker Compose,
// PGHOST is the *service name* of the database ("db"), not an IP or localhost.
// The pool is stored on globalThis so `next dev` hot reloads don't open new pools.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (!globalForPg.pgPool) {
  pool.on('error', (err) => console.error('[pg] idle client error:', err.message));
  globalForPg.pgPool = pool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
