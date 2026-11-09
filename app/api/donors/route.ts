import { query } from '@/lib/db';
import { DONOR_COLUMNS, likePattern } from '@/lib/queries';
import { badRequest, handleError, json, readBody } from '@/lib/http';
import { SPECIES } from '@/lib/constants';
import { validateDonor } from '@/lib/validation';
import type { Donor, Species } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/donors?q=&species=&blood_type=&location=&available=&limit=
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const where: string[] = [];
    const params: unknown[] = [];

    const q = sp.get('q')?.trim();
    if (q) {
      params.push(likePattern(q));
      where.push(`pet_name ILIKE $${params.length}`);
    }

    const species = sp.get('species');
    if (species) {
      if (!SPECIES.includes(species as Species)) return badRequest('species must be Cat or Dog');
      params.push(species);
      where.push(`species = $${params.length}`);
    }

    const bloodType = sp.get('blood_type');
    if (bloodType) {
      params.push(bloodType);
      where.push(`blood_type = $${params.length}`);
    }

    const location = sp.get('location')?.trim();
    if (location) {
      params.push(likePattern(location));
      where.push(`location ILIKE $${params.length}`);
    }

    const available = sp.get('available');
    if (available === 'true' || available === 'false') {
      params.push(available === 'true');
      where.push(`is_available = $${params.length}`);
    }

    let sql = `SELECT ${DONOR_COLUMNS} FROM donors`;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY created_at DESC, id DESC';

    const limit = Number(sp.get('limit'));
    if (Number.isInteger(limit) && limit > 0) {
      params.push(Math.min(limit, 500));
      sql += ` LIMIT $${params.length}`;
    }

    return json(await query<Donor>(sql, params));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/donors - register a new donor (201 Created)
export async function POST(req: Request) {
  try {
    const result = validateDonor(await readBody(req));
    if (!result.ok) return badRequest('Validation failed', result.fields);

    const d = result.data;
    const rows = await query<Donor>(
      `INSERT INTO donors
         (pet_name, photo_url, species, breed, age_years, weight_kg, blood_type, location, owner_contact, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${DONOR_COLUMNS}`,
      [d.pet_name, d.photo_url, d.species, d.breed, d.age_years, d.weight_kg, d.blood_type, d.location, d.owner_contact, d.is_available],
    );
    return json(rows[0], 201);
  } catch (err) {
    return handleError(err);
  }
}
