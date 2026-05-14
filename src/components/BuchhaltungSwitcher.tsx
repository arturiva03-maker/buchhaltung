'use client';

import { useEffect, useRef, useState } from 'react';
import { Buchhaltung } from '@/types';

interface Props {
  buchhaltungen: Buchhaltung[];
  aktiveId: string;
  onWechseln: (id: string) => void;
  onNeu: (name: string) => void;
  onUmbenennen: (id: string, name: string) => void;
  onLoeschen: (id: string) => void;
}

export default function BuchhaltungSwitcher({
  buchhaltungen,
  aktiveId,
  onWechseln,
  onNeu,
  onUmbenennen,
  onLoeschen,
}: Props) {
  const [modus, setModus] = useState<'idle' | 'neu' | 'umbenennen'>('idle');
  const [eingabe, setEingabe] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const aktive = buchhaltungen.find((b) => b.id === aktiveId);

  useEffect(() => {
    if (modus !== 'idle') inputRef.current?.focus();
  }, [modus]);

  const starteNeu = () => {
    setEingabe(String(new Date().getFullYear()));
    setModus('neu');
  };

  const starteUmbenennen = () => {
    if (!aktive) return;
    setEingabe(aktive.name);
    setModus('umbenennen');
  };

  const abbrechen = () => {
    setModus('idle');
    setEingabe('');
  };

  const bestaetigen = () => {
    const name = eingabe.trim();
    if (!name) {
      abbrechen();
      return;
    }
    if (modus === 'neu') onNeu(name);
    else if (modus === 'umbenennen' && aktive) onUmbenennen(aktive.id, name);
    setModus('idle');
    setEingabe('');
  };

  const handleLoeschen = () => {
    if (!aktive) return;
    const eintraege = aktive.buchungen.length + aktive.geldtransits.length;
    const meldung =
      eintraege > 0
        ? `Buchhaltung „${aktive.name}" mit ${eintraege} Einträgen wirklich löschen?`
        : `Buchhaltung „${aktive.name}" wirklich löschen?`;
    if (confirm(meldung)) onLoeschen(aktive.id);
  };

  if (modus !== 'idle') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              bestaetigen();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              abbrechen();
            }
          }}
          placeholder={modus === 'neu' ? 'Name der neuen Buchhaltung' : 'Neuer Name'}
          className="px-3 py-2 rounded-md text-gray-900 bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm min-w-[14rem]"
        />
        <button
          type="button"
          onClick={bestaetigen}
          className="px-3 py-2 text-sm font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50"
        >
          {modus === 'neu' ? 'Anlegen' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={abbrechen}
          className="px-3 py-2 text-sm font-medium rounded-md bg-blue-800 text-white hover:bg-blue-900"
        >
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="buchhaltung-switcher" className="sr-only">
        Buchhaltung auswählen
      </label>
      <select
        id="buchhaltung-switcher"
        value={aktiveId}
        onChange={(e) => onWechseln(e.target.value)}
        className="px-3 py-2 rounded-md text-gray-900 bg-white border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium min-w-[12rem]"
      >
        {buchhaltungen.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={starteNeu}
        title="Neue Buchhaltung anlegen"
        className="px-3 py-2 text-sm font-medium rounded-md bg-white text-blue-700 hover:bg-blue-50"
      >
        + Neu
      </button>
      <button
        type="button"
        onClick={starteUmbenennen}
        disabled={!aktive}
        title="Aktive Buchhaltung umbenennen"
        className="px-3 py-2 text-sm font-medium rounded-md bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-50"
      >
        Umbenennen
      </button>
      <button
        type="button"
        onClick={handleLoeschen}
        disabled={!aktive}
        title="Aktive Buchhaltung löschen"
        className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        Löschen
      </button>
    </div>
  );
}
