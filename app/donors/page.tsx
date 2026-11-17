'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/lib/api-client';
import { ALL_BLOOD_TYPES, BLOOD_TYPES, SPECIES } from '@/lib/constants';
import { useDebounce } from '@/lib/hooks';
import type { Donor, Species } from '@/lib/types';
import { DonorCard } from '@/components/donors/DonorCard';
import { DonorDetail } from '@/components/donors/DonorDetail';
import { DonorForm } from '@/components/donors/DonorForm';
import { Icon } from '@/components/ui/Icons';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

const EMPTY = { q: '', species: '', blood_type: '', location: '', available: '' };

function DonorsView() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [filters, setFilters] = useState({ ...EMPTY, q: search.get('q') ?? '' });
  const [donors, setDonors] = useState<Donor[] | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Donor | null>(null);
  const [editing, setEditing] = useState<Donor | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Donor | null>(null);
  const [busy, setBusy] = useState(false);

  const q = useDebounce(filters.q);
  const latest = useRef(0);

  // The global search box in the top bar navigates here with ?q=..., "Register donor" uses ?new=1.
  useEffect(() => {
    const urlQ = search.get('q');
    if (urlQ !== null) setFilters((f) => (f.q === urlQ ? f : { ...f, q: urlQ }));
    if (search.get('new') === '1') {
      setEditing('new');
      router.replace(pathname);
    }
  }, [search, router, pathname]);

  const load = useCallback(async () => {
    const ticket = ++latest.current;
    try {
      const [list, locs] = await Promise.all([
        api.listDonors({ ...filters, q }),
        api.locations(),
      ]);
      if (ticket !== latest.current) return; // a newer request already finished
      setDonors(list);
      setLocations(locs);
      setError(null);
    } catch (err) {
      if (ticket === latest.current) setError(errorMessage(err));
    }
  }, [filters.species, filters.blood_type, filters.location, filters.available, q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const bloodOptions = filters.species ? BLOOD_TYPES[filters.species as Species] : ALL_BLOOD_TYPES;
  const hasFilters = Object.values(filters).some(Boolean);

  function setFilter(key: keyof typeof EMPTY, value: string) {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === 'species' && next.blood_type && value && !BLOOD_TYPES[value as Species].includes(next.blood_type)) {
        next.blood_type = '';
      }
      return next;
    });
  }

  async function toggleAvailability(donor: Donor) {
    setBusy(true);
    try {
      const updated = await api.updateDonor(donor.id, { is_available: !donor.is_available });
      setSelected(updated);
      toast(`${updated.pet_name} is now ${updated.is_available ? 'available' : 'unavailable'}`);
      await load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteDonor(deleting.id);
      toast(`${deleting.pet_name} was removed from the registry`);
      setDeleting(null);
      setSelected(null);
      await load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Donor Directory</h1>
          <p className="mt-1 text-sm font-semibold text-cocoa/70">Browse pets that are registered as potential blood donors.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" /> Register donor
        </button>
      </div>

      <section aria-label="Filters" className="grid gap-3 rounded-3xl bg-lavender p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="relative">
          <Icon name="search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/50" />
          <input
            className="input pl-10"
            placeholder="Search by pet name..."
            aria-label="Search by pet name"
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
          />
        </div>
        <select className="input" aria-label="Filter by species" value={filters.species} onChange={(e) => setFilter('species', e.target.value)}>
          <option value="">All species</option>
          {SPECIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by blood type" value={filters.blood_type} onChange={(e) => setFilter('blood_type', e.target.value)}>
          <option value="">All blood types</option>
          {bloodOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by location" value={filters.location} onChange={(e) => setFilter('location', e.target.value)}>
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by availability" value={filters.available} onChange={(e) => setFilter('available', e.target.value)}>
          <option value="">Any availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
          <button type="button" className="btn btn-danger btn-sm" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {donors === null && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-lavender" />
          ))}
        </div>
      )}

      {donors && (
        <>
          <p className="text-sm font-bold text-cocoa/70" aria-live="polite">
            {donors.length} {donors.length === 1 ? 'donor' : 'donors'} found
            {hasFilters && (
              <button type="button" className="ml-3 underline" onClick={() => setFilters(EMPTY)}>
                Clear filters
              </button>
            )}
          </p>
          {donors.length === 0 ? (
            <div className="rounded-3xl bg-cream px-6 py-14 text-center">
              <p className="text-5xl" aria-hidden="true">🐾</p>
              <p className="mt-3 font-display text-2xl">No donors found</p>
              <p className="mt-1 text-sm text-cocoa/70">Try other filters, or register the first matching donor.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {donors.map((donor, i) => (
                <DonorCard key={donor.id} donor={donor} index={i} onOpen={() => setSelected(donor)} />
              ))}
            </div>
          )}
        </>
      )}

      {selected && !editing && !deleting && (
        <DonorDetail
          donor={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(selected)}
          onDelete={() => setDeleting(selected)}
          onToggleAvailability={() => toggleAvailability(selected)}
        />
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Register a donor' : `Edit ${editing.pet_name}`} onClose={() => setEditing(null)}>
          <DonorForm
            donor={editing === 'new' ? undefined : editing}
            locations={locations}
            onCancel={() => setEditing(null)}
            onSaved={(saved) => {
              setEditing(null);
              setSelected(editing === 'new' ? null : saved);
              load();
            }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete donor?"
          message={
            <>
              <strong>{deleting.pet_name}</strong> will be permanently removed from the registry. Requests that selected this donor
              are kept, but lose the link.
            </>
          }
          confirmLabel="Delete donor"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export default function DonorsPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <DonorsView />
    </Suspense>
  );
}
