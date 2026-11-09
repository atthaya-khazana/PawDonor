'use client';

import { useState, type FormEvent } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api-client';
import { BLOOD_TYPES, LOCATION_SUGGESTIONS, SPECIES, STATUSES, URGENCIES } from '@/lib/constants';
import type { DonationRequest, RequestStatus, Species, Urgency } from '@/lib/types';
import { Field, Segmented } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

interface FormState {
  pet_name: string;
  species: Species;
  blood_type: string;
  location: string;
  urgency: Urgency;
  status: RequestStatus;
  notes: string;
}

interface Props {
  request?: DonationRequest;
  locations: string[];
  onSaved: (request: DonationRequest) => void;
  onCancel: () => void;
}

export function RequestForm({ request, locations, onSaved, onCancel }: Props) {
  const toast = useToast();
  const [v, setV] = useState<FormState>({
    pet_name: request?.pet_name ?? '',
    species: request?.species ?? 'Dog',
    blood_type: request?.blood_type ?? '',
    location: request?.location ?? '',
    urgency: request?.urgency ?? 'Medium',
    status: request?.status ?? 'Pending',
    notes: request?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editing a field clears its server-side validation message.
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setV((s) => ({ ...s, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
    setFormError(null);
  };
  const hasFieldErrors = Object.values(errors).some(Boolean);
  const locationOptions = Array.from(new Set([...locations, ...LOCATION_SUGGESTIONS]));

  function changeSpecies(species: Species) {
    setV((s) => ({ ...s, species, blood_type: BLOOD_TYPES[species].includes(s.blood_type) ? s.blood_type : '' }));
    setErrors((e) => ({ ...e, species: '', blood_type: '' }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const saved = request ? await api.updateRequest(request.id, v) : await api.createRequest(v);
      toast(request ? `Request for ${saved.pet_name} was updated` : `Request for ${saved.pet_name} was created`);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pet name" htmlFor="req-name" error={errors.pet_name}>
          <input id="req-name" className="input" value={v.pet_name} maxLength={80} onChange={(e) => set('pet_name', e.target.value)} placeholder="Pet that needs blood" />
        </Field>
        <Field label="Species" error={errors.species}>
          <Segmented label="Species" value={v.species} options={SPECIES} onChange={changeSpecies} />
        </Field>
        <Field label="Required blood type" htmlFor="req-blood" error={errors.blood_type}>
          <select id="req-blood" className="input" value={v.blood_type} onChange={(e) => set('blood_type', e.target.value)}>
            <option value="">Select blood type</option>
            {BLOOD_TYPES[v.species].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location (city)" htmlFor="req-location" error={errors.location}>
          <input id="req-location" className="input" list="req-location-options" value={v.location} maxLength={80} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bandung" />
          <datalist id="req-location-options">
            {locationOptions.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
        <Field label="Urgency" error={errors.urgency}>
          <Segmented label="Urgency" value={v.urgency} options={URGENCIES} onChange={(u) => set('urgency', u)} />
        </Field>
        <Field label="Status" htmlFor="req-status" error={errors.status}>
          <select id="req-status" className="input" value={v.status} onChange={(e) => set('status', e.target.value as RequestStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Additional notes" htmlFor="req-notes" error={errors.notes} hint="Optional. Max 500 characters.">
        <textarea id="req-notes" className="input min-h-24 resize-y" rows={3} maxLength={500} value={v.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Clinic, condition, deadline..." />
      </Field>

      {formError && !hasFieldErrors && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : request ? 'Save changes' : 'Create request'}
        </button>
      </div>
    </form>
  );
}
