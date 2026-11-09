'use client';

import { useState, type FormEvent } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api-client';
import { BLOOD_TYPES, BREED_SUGGESTIONS, LOCATION_SUGGESTIONS, SPECIES } from '@/lib/constants';
import type { Donor, Species } from '@/lib/types';
import { Field, Segmented } from '@/components/ui/Field';
import { PetAvatar } from '@/components/ui/PetAvatar';
import { useToast } from '@/components/ui/Toast';

interface FormState {
  pet_name: string;
  photo_url: string;
  species: Species;
  breed: string;
  age_years: string;
  weight_kg: string;
  blood_type: string;
  location: string;
  owner_contact: string;
  is_available: boolean;
}

/** Resizes a picked image in the browser so only a small JPEG (~30-60 KB) is sent to the API. */
async function resizeImage(file: File, maxSide = 480): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not supported in this browser');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

interface Props {
  donor?: Donor;
  locations: string[];
  onSaved: (donor: Donor) => void;
  onCancel: () => void;
}

export function DonorForm({ donor, locations, onSaved, onCancel }: Props) {
  const toast = useToast();
  const [v, setV] = useState<FormState>({
    pet_name: donor?.pet_name ?? '',
    photo_url: donor?.photo_url ?? '',
    species: donor?.species ?? 'Dog',
    breed: donor?.breed ?? '',
    age_years: donor ? String(donor.age_years) : '',
    weight_kg: donor ? String(donor.weight_kg) : '',
    blood_type: donor?.blood_type ?? '',
    location: donor?.location ?? '',
    owner_contact: donor?.owner_contact ?? '',
    is_available: donor?.is_available ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

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

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      set('photo_url', await resizeImage(file));
      setErrors((e) => ({ ...e, photo_url: '' }));
    } catch (err) {
      setErrors((e) => ({ ...e, photo_url: errorMessage(err) }));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const payload = {
        ...v,
        photo_url: v.photo_url || null,
        age_years: v.age_years === '' ? null : Number(v.age_years),
        weight_kg: v.weight_kg === '' ? null : Number(v.weight_kg),
      };
      const saved = donor ? await api.updateDonor(donor.id, payload) : await api.createDonor(payload);
      toast(donor ? `${saved.pet_name} was updated` : `${saved.pet_name} is now registered as a donor`);
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
      <div className="flex items-center gap-4 rounded-2xl bg-lavender p-4">
        <PetAvatar photo={v.photo_url || null} species={v.species} name={v.pet_name || 'pet'} size="lg" />
        <div className="space-y-2">
          <p className="text-sm font-bold">Photo</p>
          <div className="flex flex-wrap gap-2">
            <label className="btn btn-ghost btn-sm cursor-pointer">
              {photoBusy ? 'Processing...' : v.photo_url ? 'Change photo' : 'Upload photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {v.photo_url && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('photo_url', '')}>
                Remove
              </button>
            )}
          </div>
          {errors.photo_url ? (
            <p className="text-xs font-semibold text-red-600">{errors.photo_url}</p>
          ) : (
            <p className="text-xs text-cocoa/60">Optional. The image is resized in your browser before saving.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pet name" htmlFor="donor-name" error={errors.pet_name}>
          <input id="donor-name" className="input" value={v.pet_name} maxLength={80} onChange={(e) => set('pet_name', e.target.value)} placeholder="e.g. Bella" />
        </Field>
        <Field label="Species" error={errors.species}>
          <Segmented label="Species" value={v.species} options={SPECIES} onChange={changeSpecies} />
        </Field>
        <Field label="Breed" htmlFor="donor-breed" error={errors.breed}>
          <input id="donor-breed" className="input" list="breed-options" value={v.breed} maxLength={80} onChange={(e) => set('breed', e.target.value)} placeholder="e.g. Golden Retriever" />
          <datalist id="breed-options">
            {BREED_SUGGESTIONS[v.species].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="Blood type" htmlFor="donor-blood" error={errors.blood_type}>
          <select id="donor-blood" className="input" value={v.blood_type} onChange={(e) => set('blood_type', e.target.value)}>
            <option value="">Select blood type</option>
            {BLOOD_TYPES[v.species].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Age (years)" htmlFor="donor-age" error={errors.age_years}>
          <input id="donor-age" className="input" type="number" min={1} max={25} step={1} inputMode="numeric" value={v.age_years} onChange={(e) => set('age_years', e.target.value)} placeholder="e.g. 4" />
        </Field>
        <Field label="Weight (kg)" htmlFor="donor-weight" error={errors.weight_kg}>
          <input id="donor-weight" className="input" type="number" min={0.1} max={100} step={0.1} inputMode="decimal" value={v.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} placeholder="e.g. 28.5" />
        </Field>
        <Field label="Location (city)" htmlFor="donor-location" error={errors.location}>
          <input id="donor-location" className="input" list="location-options" value={v.location} maxLength={80} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bandung" />
          <datalist id="location-options">
            {locationOptions.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
        <Field label="Owner contact" htmlFor="donor-contact" error={errors.owner_contact} hint="Use a dummy email or handle for demos.">
          <input id="donor-contact" className="input" value={v.owner_contact} maxLength={120} onChange={(e) => set('owner_contact', e.target.value)} placeholder="e.g. owner@example.com" />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-lavender px-4 py-3">
        <input type="checkbox" className="h-5 w-5 accent-tangerine" checked={v.is_available} onChange={(e) => set('is_available', e.target.checked)} />
        <span className="text-sm">
          <span className="font-bold">Available to donate</span>
          <span className="block text-xs text-cocoa/60">Only available donors show up in request matching.</span>
        </span>
      </label>

      {formError && !hasFieldErrors && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || photoBusy}>
          {saving ? 'Saving...' : donor ? 'Save changes' : 'Register donor'}
        </button>
      </div>
    </form>
  );
}
