export type Species = 'Cat' | 'Dog';
export type Urgency = 'Low' | 'Medium' | 'High';
export type RequestStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Donor {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface DonationRequest {
  id: number;
  pet_name: string;
  species: Species;
  blood_type: string;
  location: string;
  urgency: Urgency;
  notes: string | null;
  status: RequestStatus;
  donor_id: number | null;
  donor_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonorMatch {
  donor: Donor;
  blood_match: 'exact' | 'compatible';
  same_location: boolean;
  score: number;
}

export interface OpenRequest extends DonationRequest {
  candidates: number;
}

export interface Stats {
  donors: { total: number; available: number; unavailable: number; dogs: number; cats: number };
  requests: { total: number; pending: number; in_progress: number; completed: number };
  bloodTypes: { species: Species; blood_type: string; count: number }[];
  locations: { location: string; count: number }[];
  openRequests: OpenRequest[];
}
