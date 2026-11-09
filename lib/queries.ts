import { query } from './db';
import type { DonationRequest, Donor, Species } from './types';

// NUMERIC comes back from node-postgres as a string, so weight is cast to float.
export const DONOR_COLUMNS = `id, pet_name, photo_url, species, breed, age_years,
  weight_kg::float8 AS weight_kg, blood_type, location, owner_contact,
  is_available, created_at, updated_at`;

export const REQUEST_SELECT = `SELECT r.id, r.pet_name, r.species, r.blood_type, r.location,
  r.urgency, r.notes, r.status, r.donor_id, d.pet_name AS donor_name,
  r.created_at, r.updated_at
  FROM donation_requests r
  LEFT JOIN donors d ON d.id = r.donor_id`;

export async function getDonor(id: number): Promise<Donor | null> {
  const rows = await query<Donor>(`SELECT ${DONOR_COLUMNS} FROM donors WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getRequest(id: number): Promise<DonationRequest | null> {
  const rows = await query<DonationRequest>(`${REQUEST_SELECT} WHERE r.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listAvailableDonors(species?: Species): Promise<Donor[]> {
  if (species) {
    return query<Donor>(
      `SELECT ${DONOR_COLUMNS} FROM donors WHERE is_available = TRUE AND species = $1`,
      [species],
    );
  }
  return query<Donor>(`SELECT ${DONOR_COLUMNS} FROM donors WHERE is_available = TRUE`);
}

/** Escapes % and _ so user input is matched literally inside ILIKE. */
export function likePattern(input: string): string {
  return `%${input.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
