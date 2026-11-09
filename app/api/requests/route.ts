import { query } from '@/lib/db';
import { REQUEST_SELECT, getRequest, likePattern } from '@/lib/queries';
import { badRequest, handleError, json, readBody } from '@/lib/http';
import { SPECIES, STATUSES, URGENCIES } from '@/lib/constants';
import { validateRequest } from '@/lib/validation';
import type { DonationRequest, RequestStatus, Species, Urgency } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/requests?q=&status=&urgency=&species=&limit=
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const where: string[] = [];
    const params: unknown[] = [];

    const q = sp.get('q')?.trim();
    if (q) {
      params.push(likePattern(q));
      where.push(`r.pet_name ILIKE $${params.length}`);
    }

    const status = sp.get('status');
    if (status) {
      if (!STATUSES.includes(status as RequestStatus)) return badRequest('Invalid status filter');
      params.push(status);
      where.push(`r.status = $${params.length}`);
    }

    const urgency = sp.get('urgency');
    if (urgency) {
      if (!URGENCIES.includes(urgency as Urgency)) return badRequest('Invalid urgency filter');
      params.push(urgency);
      where.push(`r.urgency = $${params.length}`);
    }

    const species = sp.get('species');
    if (species) {
      if (!SPECIES.includes(species as Species)) return badRequest('species must be Cat or Dog');
      params.push(species);
      where.push(`r.species = $${params.length}`);
    }

    let sql = REQUEST_SELECT;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY r.created_at DESC, r.id DESC';

    const limit = Number(sp.get('limit'));
    if (Number.isInteger(limit) && limit > 0) {
      params.push(Math.min(limit, 500));
      sql += ` LIMIT $${params.length}`;
    }

    return json(await query<DonationRequest>(sql, params));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/requests - create a donation request (201 Created)
export async function POST(req: Request) {
  try {
    const result = validateRequest(await readBody(req));
    if (!result.ok) return badRequest('Validation failed', result.fields);

    const r = result.data;
    const rows = await query<{ id: number }>(
      `INSERT INTO donation_requests (pet_name, species, blood_type, location, urgency, notes, status, donor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [r.pet_name, r.species, r.blood_type, r.location, r.urgency, r.notes, r.status, r.donor_id],
    );
    return json(await getRequest(rows[0].id), 201);
  } catch (err) {
    return handleError(err);
  }
}
