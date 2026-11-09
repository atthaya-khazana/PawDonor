import { BLOOD_TYPES, SPECIES, STATUSES, URGENCIES } from './constants';
import type { RequestStatus, Species, Urgency } from './types';

export type FieldErrors = Record<string, string>;
export type Validated<T> = { ok: true; data: T } | { ok: false; fields: FieldErrors };

export interface DonorInput {
  pet_name: string;
  photo_url: string | null;
  species: Species;
  breed: string;
  age_years: number;
  weight_kg: number;
  blood_type: string;
  location: string;
  owner_contact: string;
  is_available: boolean;
}

export interface RequestInput {
  pet_name: string;
  species: Species;
  blood_type: string;
  location: string;
  urgency: Urgency;
  notes: string | null;
  status: RequestStatus;
  donor_id: number | null;
}

const MAX_PHOTO_CHARS = 300_000; // ~220 KB of image data once base64-decoded

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function text(v: unknown, field: string, label: string, min: number, max: number, errors: FieldErrors): string {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
  if (s.length === 0 && min > 0) errors[field] = `${label} is required`;
  else if (s.length < min) errors[field] = `${label} must be at least ${min} characters`;
  else if (s.length > max) errors[field] = `${label} must be at most ${max} characters`;
  return s;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return NaN;
}

function species(v: unknown, errors: FieldErrors): Species {
  if (SPECIES.includes(v as Species)) return v as Species;
  errors.species = 'Species must be Cat or Dog';
  return 'Dog';
}

function bloodType(v: unknown, sp: Species, errors: FieldErrors): string {
  if (typeof v === 'string' && BLOOD_TYPES[sp].includes(v)) return v;
  errors.blood_type = `Blood type must be one of: ${BLOOD_TYPES[sp].join(', ')}`;
  return '';
}

function photo(v: unknown, errors: FieldErrors): string | null {
  if (v === undefined || v === null || v === '') return null;
  const s = typeof v === 'string' ? v.trim() : '';
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) {
    if (s.length <= MAX_PHOTO_CHARS) return s;
    errors.photo_url = 'Photo is too large, please use a smaller image';
    return null;
  }
  if (/^https?:\/\/\S+$/i.test(s) && s.length <= 500) return s;
  errors.photo_url = 'Photo must be an uploaded image or an http(s) image URL';
  return null;
}

export function validateDonor(input: unknown): Validated<DonorInput> {
  const v = asRecord(input);
  const errors: FieldErrors = {};

  const sp = species(v.species, errors);
  const data: DonorInput = {
    pet_name: text(v.pet_name, 'pet_name', 'Pet name', 1, 80, errors),
    photo_url: photo(v.photo_url, errors),
    species: sp,
    breed: text(v.breed, 'breed', 'Breed', 1, 80, errors),
    age_years: 0,
    weight_kg: 0,
    blood_type: bloodType(v.blood_type, sp, errors),
    location: text(v.location, 'location', 'Location', 1, 80, errors),
    owner_contact: text(v.owner_contact, 'owner_contact', 'Owner contact', 3, 120, errors),
    is_available: true,
  };

  const age = toNumber(v.age_years);
  if (Number.isInteger(age) && age >= 1 && age <= 25) data.age_years = age;
  else errors.age_years = 'Age must be a whole number between 1 and 25 years';

  const weight = toNumber(v.weight_kg);
  if (Number.isFinite(weight) && weight > 0 && weight <= 100) data.weight_kg = Math.round(weight * 10) / 10;
  else errors.weight_kg = 'Weight must be between 0.1 and 100 kg';

  if (v.is_available === undefined) data.is_available = true;
  else if (typeof v.is_available === 'boolean') data.is_available = v.is_available;
  else if (v.is_available === 'true' || v.is_available === 'false') data.is_available = v.is_available === 'true';
  else errors.is_available = 'Availability must be true or false';

  return Object.keys(errors).length ? { ok: false, fields: errors } : { ok: true, data };
}

export function validateRequest(input: unknown): Validated<RequestInput> {
  const v = asRecord(input);
  const errors: FieldErrors = {};

  const sp = species(v.species, errors);
  const urgency = v.urgency === undefined ? 'Medium' : v.urgency;
  const status = v.status === undefined ? 'Pending' : v.status;

  const data: RequestInput = {
    pet_name: text(v.pet_name, 'pet_name', 'Pet name', 1, 80, errors),
    species: sp,
    blood_type: bloodType(v.blood_type, sp, errors),
    location: text(v.location, 'location', 'Location', 1, 80, errors),
    urgency: 'Medium',
    notes: null,
    status: 'Pending',
    donor_id: null,
  };

  if (URGENCIES.includes(urgency as Urgency)) data.urgency = urgency as Urgency;
  else errors.urgency = 'Urgency must be Low, Medium or High';

  if (STATUSES.includes(status as RequestStatus)) data.status = status as RequestStatus;
  else errors.status = 'Status must be Pending, In Progress or Completed';

  if (typeof v.notes === 'string' && v.notes.trim() !== '') {
    if (v.notes.trim().length > 500) errors.notes = 'Notes must be at most 500 characters';
    else data.notes = v.notes.trim();
  } else if (v.notes !== undefined && v.notes !== null && typeof v.notes !== 'string') {
    errors.notes = 'Notes must be text';
  }

  if (v.donor_id !== undefined && v.donor_id !== null && v.donor_id !== '') {
    const id = toNumber(v.donor_id);
    if (Number.isInteger(id) && id > 0 && id <= 2_147_483_647) data.donor_id = id;
    else errors.donor_id = 'Donor id must be a positive integer';
  }

  return Object.keys(errors).length ? { ok: false, fields: errors } : { ok: true, data };
}
