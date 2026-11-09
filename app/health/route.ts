import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /health - used by the Docker healthcheck and for quick manual checks.
// 200 when the app AND the database respond, 503 when the database is down.
export async function GET() {
  try {
    await pool.query('SELECT 1');
    return NextResponse.json({
      status: 'ok',
      database: 'up',
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: 'error', database: 'down', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
