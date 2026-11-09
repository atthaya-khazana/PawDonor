import { query } from '@/lib/db';
import { REQUEST_SELECT, listAvailableDonors } from '@/lib/queries';
import { findMatches } from '@/lib/matching';
import { handleError, json } from '@/lib/http';
import type { DonationRequest, Stats } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/stats - numbers for the dashboard
export async function GET() {
  try {
    const [donorRows, requestRows, bloodTypes, locations, open, availableDonors] = await Promise.all([
      query<Stats['donors']>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_available)::int AS available,
                COUNT(*) FILTER (WHERE NOT is_available)::int AS unavailable,
                COUNT(*) FILTER (WHERE species = 'Dog')::int AS dogs,
                COUNT(*) FILTER (WHERE species = 'Cat')::int AS cats
         FROM donors`,
      ),
      query<Stats['requests']>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending,
                COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress,
                COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed
         FROM donation_requests`,
      ),
      query<Stats['bloodTypes'][number]>(
        `SELECT species, blood_type, COUNT(*)::int AS count
         FROM donors GROUP BY species, blood_type
         ORDER BY count DESC, species, blood_type`,
      ),
      query<Stats['locations'][number]>(
        `SELECT MIN(location) AS location, COUNT(*)::int AS count
         FROM donors GROUP BY LOWER(location)
         ORDER BY count DESC, MIN(location) LIMIT 6`,
      ),
      query<DonationRequest>(
        `${REQUEST_SELECT}
         WHERE r.status <> 'Completed'
         ORDER BY CASE r.urgency WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
                  r.created_at DESC
         LIMIT 4`,
      ),
      listAvailableDonors(),
    ]);

    const stats: Stats = {
      donors: donorRows[0],
      requests: requestRows[0],
      bloodTypes,
      locations,
      openRequests: open.map((r) => ({ ...r, candidates: findMatches(r, availableDonors).length })),
    };
    return json(stats);
  } catch (err) {
    return handleError(err);
  }
}
