import { query } from '@/lib/db';
import { handleError, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

// GET /api/locations - distinct locations used by donors and requests (for filters)
export async function GET() {
  try {
    const rows = await query<{ location: string }>(
      `SELECT MIN(location) AS location
       FROM (SELECT location FROM donors UNION ALL SELECT location FROM donation_requests) t
       GROUP BY LOWER(location)
       ORDER BY 1`,
    );
    return json(rows.map((r) => r.location));
  } catch (err) {
    return handleError(err);
  }
}
