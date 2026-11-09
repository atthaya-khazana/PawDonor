import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-cocoa/60">{hint}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label: string;
}

/** Small radio-style button group (used for species and urgency). */
export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
            value === option ? 'border-cocoa bg-cocoa text-white' : 'border-cocoa/20 bg-white hover:bg-cocoa/5'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
