import type { RequestStatus, Species, Urgency } from './types';

export const SPECIES: Species[] = ['Dog', 'Cat'];

// Keep in sync with the CHECK constraints in db/init.sql.
export const BLOOD_TYPES: Record<Species, string[]> = {
  Dog: ['DEA 1.1+', 'DEA 1.1-', 'DEA 1.2', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7'],
  Cat: ['A', 'B', 'AB'],
};
export const ALL_BLOOD_TYPES = [...BLOOD_TYPES.Dog, ...BLOOD_TYPES.Cat];

export const URGENCIES: Urgency[] = ['Low', 'Medium', 'High'];
export const STATUSES: RequestStatus[] = ['Pending', 'In Progress', 'Completed'];

export const LOCATION_SUGGESTIONS = [
  'Bandung', 'Jakarta', 'Bekasi', 'Bogor', 'Depok', 'Tangerang',
  'Surabaya', 'Yogyakarta', 'Semarang', 'Malang', 'Medan',
];

export const BREED_SUGGESTIONS: Record<Species, string[]> = {
  Dog: ['Golden Retriever', 'Labrador Retriever', 'Beagle', 'Siberian Husky', 'German Shepherd', 'Poodle', 'Pomeranian', 'Shih Tzu', 'Mixed breed'],
  Cat: ['Domestic Shorthair', 'Kampung', 'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal', 'Anggora'],
};

export const speciesEmoji = (s: Species) => (s === 'Dog' ? '🐶' : '🐱');
