'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/lib/api-client';
import { SPECIES, STATUSES, URGENCIES, speciesEmoji } from '@/lib/constants';
import { formatDate, useDebounce } from '@/lib/hooks';
import type { DonationRequest, RequestStatus } from '@/lib/types';
import { BloodChip, UrgencyChip } from '@/components/ui/Badges';
import { Icon } from '@/components/ui/Icons';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { MatchesModal } from '@/components/requests/MatchesModal';
import { RequestForm } from '@/components/requests/RequestForm';

const EMPTY = { q: '', status: '', urgency: '', species: '' };
const URGENCY_BORDER = { High: 'border-red-500', Medium: 'border-amber-400', Low: 'border-emerald-400' } as const;

function RequestsView() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [filters, setFilters] = useState(EMPTY);
  const [requests, setRequests] = useState<DonationRequest[] | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<DonationRequest | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DonationRequest | null>(null);
  const [matchFor, setMatchFor] = useState<DonationRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const q = useDebounce(filters.q);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++latest.current;
    try {
      const [list, locs] = await Promise.all([api.listRequests({ ...filters, q }), api.locations()]);
      if (ticket !== latest.current) return;
      setRequests(list);
      setLocations(locs);
      setError(null);
    } catch (err) {
      if (ticket === latest.current) setError(errorMessage(err));
    }
  }, [filters.status, filters.urgency, filters.species, q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  // "New request" button in the top bar uses ?new=1, the dashboard's "Find donors" uses ?match=<id>.
  useEffect(() => {
    if (search.get('new') === '1') {
      setEditing('new');
      router.replace(pathname);
    }
    const matchId = Number(search.get('match'));
    if (Number.isInteger(matchId) && matchId > 0) {
      router.replace(pathname);
      api
        .listRequests()
        .then((all) => {
          const found = all.find((r) => r.id === matchId);
          if (found) setMatchFor(found);
        })
        .catch(() => {});
    }
  }, [search, router, pathname]);

  const hasFilters = Object.values(filters).some(Boolean);
  const setFilter = (key: keyof typeof EMPTY, value: string) => setFilters((f) => ({ ...f, [key]: value }));

  async function changeStatus(request: DonationRequest, status: RequestStatus) {
    try {
      await api.updateRequest(request.id, { status });
      toast(`${request.pet_name}: status set to ${status}`);
      await load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteRequest(deleting.id);
      toast(`Request for ${deleting.pet_name} was deleted`);
      setDeleting(null);
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
          <h1 className="page-title">Donation Requests</h1>
          <p className="mt-1 text-sm font-semibold text-cocoa/70">Pets that need blood. Use &ldquo;Find donors&rdquo; to see candidates.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" /> New request
        </button>
      </div>

      <section aria-label="Filters" className="grid gap-3 rounded-3xl bg-lavender p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="relative">
          <Icon name="search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/50" />
          <input className="input pl-10" placeholder="Search by pet name..." aria-label="Search requests by pet name" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
        </div>
        <select className="input" aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by urgency" value={filters.urgency} onChange={(e) => setFilter('urgency', e.target.value)}>
          <option value="">All urgency levels</option>
          {URGENCIES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by species" value={filters.species} onChange={(e) => setFilter('species', e.target.value)}>
          <option value="">All species</option>
          {SPECIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
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

      {requests === null && !error && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-lavender" />
          ))}
        </div>
      )}

      {requests && (
        <>
          <p className="text-sm font-bold text-cocoa/70" aria-live="polite">
            {requests.length} {requests.length === 1 ? 'request' : 'requests'} found
            {hasFilters && (
              <button type="button" className="ml-3 underline" onClick={() => setFilters(EMPTY)}>
                Clear filters
              </button>
            )}
          </p>

          {requests.length === 0 ? (
            <div className="rounded-3xl bg-cream px-6 py-14 text-center">
              <p className="text-5xl" aria-hidden="true">🩸</p>
              <p className="mt-3 font-display text-2xl">No requests found</p>
              <p className="mt-1 text-sm text-cocoa/70">Create a request when a pet needs a blood donor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <article
                  key={r.id}
                  className={`flex flex-col gap-4 rounded-3xl border-l-8 bg-white p-4 shadow-sm ring-1 ring-cocoa/10 lg:flex-row lg:items-center ${URGENCY_BORDER[r.urgency]}`}
                >
                  <div className="flex items-center gap-3 lg:w-60">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lilac text-2xl" aria-hidden="true">
                      {speciesEmoji(r.species)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-xl leading-tight">{r.pet_name}</h3>
                      <p className="text-xs font-semibold text-cocoa/60">
                        {r.species} · {formatDate(r.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                      <BloodChip type={r.blood_type} />
                      <UrgencyChip urgency={r.urgency} />
                      <span className="flex items-center gap-1">
                        <Icon name="pin" className="h-3.5 w-3.5" /> {r.location}
                      </span>
                      {r.donor_name && (
                        <span className="chip bg-emerald-100 text-emerald-800">
                          <Icon name="drop" className="h-3 w-3" /> Donor: {r.donor_name}
                        </span>
                      )}
                    </div>
                    {r.notes && <p className="line-clamp-2 text-sm text-cocoa/70">{r.notes}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Status of request for ${r.pet_name}`}
                      className="input w-auto py-1.5 text-xs font-bold"
                      value={r.status}
                      onChange={(e) => changeStatus(r, e.target.value as RequestStatus)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setMatchFor(r)}>
                      <Icon name="search" /> Find donors
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(r)} aria-label={`Edit request for ${r.pet_name}`}>
                      <Icon name="edit" />
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(r)} aria-label={`Delete request for ${r.pet_name}`}>
                      <Icon name="trash" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New donation request' : `Edit request for ${editing.pet_name}`} onClose={() => setEditing(null)}>
          <RequestForm
            request={editing === 'new' ? undefined : editing}
            locations={locations}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        </Modal>
      )}

      {matchFor && <MatchesModal request={matchFor} onClose={() => setMatchFor(null)} onChanged={load} />}

      {deleting && (
        <ConfirmDialog
          title="Delete request?"
          message={
            <>
              The request for <strong>{deleting.pet_name}</strong> will be permanently removed.
            </>
          }
          confirmLabel="Delete request"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={null}>
      <RequestsView />
    </Suspense>
  );
}
