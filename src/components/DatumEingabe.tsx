'use client';

import { useEffect, useRef, useState } from 'react';

function KalenderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

interface DatumEingabeProps {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  required?: boolean;
  className?: string;
  compact?: boolean;
}

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const isoToGerman = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}.${m}.${y}`;
};

const relativ = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toISO(d);
};

function parseEingabe(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed === 'h' || trimmed === 'heute') return relativ(0);
  if (trimmed === 'g' || trimmed === 'gestern') return relativ(-1);
  if (trimmed === 'v' || trimmed === 'vorgestern') return relativ(-2);
  if (trimmed === 'm' || trimmed === 'morgen') return relativ(1);

  const parts = trimmed.replace(/[\/\-\s,]/g, '.').split('.').filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d+$/.test(p))) return null;

  const heute = new Date();
  let day: number, month: number, year: number;

  if (parts.length === 1) {
    day = parseInt(parts[0], 10);
    month = heute.getMonth() + 1;
    year = heute.getFullYear();
  } else if (parts.length === 2) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = heute.getFullYear();
  } else {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
  }

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  return toISO(date);
}

export default function DatumEingabe({
  value,
  onChange,
  id,
  required,
  className = '',
  compact = false,
}: DatumEingabeProps) {
  const [text, setText] = useState(isoToGerman(value));
  const [fehler, setFehler] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(isoToGerman(value));
    setFehler(false);
  }, [value]);

  const commit = (input: string) => {
    if (!input.trim()) {
      setFehler(!!required);
      return;
    }
    const iso = parseEingabe(input);
    if (iso) {
      setFehler(false);
      if (iso !== value) onChange(iso);
      else setText(isoToGerman(iso));
    } else {
      setFehler(true);
    }
  };

  const verschiebe = (delta: number) => {
    const basis = parseEingabe(text) ?? value;
    if (!basis) {
      onChange(relativ(delta));
      return;
    }
    const d = new Date(basis);
    d.setDate(d.getDate() + delta);
    onChange(toISO(d));
  };

  const setQuick = (offsetDays: number) => {
    onChange(relativ(offsetDays));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(text);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      verschiebe(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      verschiebe(-1);
    }
  };

  const oeffneKalender = () => {
    const el = dateRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        // fall through to focus
      }
    }
    el.focus();
    el.click();
  };

  const padding = compact ? 'px-2 py-1 text-sm' : 'px-3 py-2';
  const inputBasis = `w-full ${padding} pr-9 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
    fehler
      ? 'border-red-400 focus:ring-red-400'
      : 'border-gray-300 focus:ring-blue-500'
  }`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (fehler) setFehler(false);
          }}
          onBlur={() => commit(text)}
          onKeyDown={handleKeyDown}
          placeholder="TT.MM.JJJJ"
          required={required}
          className={inputBasis}
        />
        <button
          type="button"
          onClick={oeffneKalender}
          tabIndex={-1}
          aria-label="Kalender öffnen"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 rounded"
        >
          <KalenderIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>
        <input
          ref={dateRef}
          type="date"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden
          className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 pointer-events-none"
        />
      </div>
      {!compact && (
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setQuick(0)}
            className="px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-100 text-gray-700"
          >
            Heute
          </button>
          <button
            type="button"
            onClick={() => setQuick(-1)}
            className="px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-100 text-gray-700"
          >
            Gestern
          </button>
          <button
            type="button"
            onClick={() => setQuick(-2)}
            className="px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-100 text-gray-700"
          >
            Vorgestern
          </button>
          {fehler && (
            <span className="ml-auto text-red-500">Ungültiges Datum</span>
          )}
        </div>
      )}
    </div>
  );
}
