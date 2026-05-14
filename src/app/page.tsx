'use client';

import { useEffect, useState } from 'react';
import { Buchhaltung, Buchung, Geldtransit, Anfangsbestand } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import BuchungsFormular from '@/components/BuchungsFormular';
import BuchungsUebersicht from '@/components/BuchungsUebersicht';
import EinnahmenUeberschussRechnung from '@/components/EinnahmenUeberschussRechnung';
import AnfangsbestandFormular from '@/components/AnfangsbestandFormular';
import GeldtransitFormular from '@/components/GeldtransitFormular';
import BuchhaltungSwitcher from '@/components/BuchhaltungSwitcher';

type Tab = 'buchungen' | 'eur';

const leereBuchhaltung = (name: string): Buchhaltung => ({
  id: crypto.randomUUID(),
  name,
  buchungen: [],
  anfangsbestand: { bank: 0, kasse: 0 },
  geldtransits: [],
  erstelltAm: new Date().toISOString(),
});

export default function Home() {
  const [buchhaltungen, setBuchhaltungen] = useLocalStorage<Buchhaltung[]>('buchhaltungen', []);
  const [aktiveId, setAktiveId] = useLocalStorage<string>('aktiveBuchhaltungId', '');
  const [activeTab, setActiveTab] = useState<Tab>('buchungen');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [initialisiert, setInitialisiert] = useState(false);
  const [letzteSpeicherung, setLetzteSpeicherung] = useState<Date | null>(null);

  // Erstinitialisierung + Migration alter localStorage-Daten.
  // Liest direkt aus localStorage, weil useLocalStorage erst nach Mount
  // hydratisiert — sonst würden wir die gespeicherten Daten beim Reload
  // mit einer leeren Buchhaltung überschreiben.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialisiert) return;

    const vorhanden = window.localStorage.getItem('buchhaltungen');
    if (vorhanden) {
      try {
        const parsed = JSON.parse(vorhanden) as Buchhaltung[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInitialisiert(true);
          return;
        }
      } catch {
        // beschädigt — wir migrieren bzw. legen neu an
      }
    }

    try {
      const altBuchungen = window.localStorage.getItem('buchungen');
      const altAnf = window.localStorage.getItem('anfangsbestand');
      const altTransits = window.localStorage.getItem('geldtransits');
      const hatAltdaten = !!(altBuchungen || altAnf || altTransits);

      const jahr = String(new Date().getFullYear());
      const start: Buchhaltung = {
        id: crypto.randomUUID(),
        name: hatAltdaten ? `${jahr} (importiert)` : jahr,
        buchungen: altBuchungen ? (JSON.parse(altBuchungen) as Buchung[]) : [],
        anfangsbestand: altAnf
          ? (JSON.parse(altAnf) as Anfangsbestand)
          : { bank: 0, kasse: 0 },
        geldtransits: altTransits ? (JSON.parse(altTransits) as Geldtransit[]) : [],
        erstelltAm: new Date().toISOString(),
      };
      setBuchhaltungen([start]);
      setAktiveId(start.id);
    } catch (err) {
      console.error('Migration alter Daten fehlgeschlagen', err);
      const neu = leereBuchhaltung(String(new Date().getFullYear()));
      setBuchhaltungen([neu]);
      setAktiveId(neu.id);
    }
    setInitialisiert(true);
  }, [initialisiert, setAktiveId, setBuchhaltungen]);

  // Zeitstempel der letzten Speicherung — useLocalStorage schreibt bei jedem
  // setBuchhaltungen direkt in localStorage, hier nur Anzeige.
  useEffect(() => {
    if (!initialisiert) return;
    setLetzteSpeicherung(new Date());
  }, [buchhaltungen, initialisiert]);

  // Aktive Buchhaltung sicherstellen, falls die gespeicherte ID nicht mehr existiert
  useEffect(() => {
    if (!initialisiert) return;
    if (buchhaltungen.length === 0) return;
    if (!aktiveId || !buchhaltungen.some((b) => b.id === aktiveId)) {
      setAktiveId(buchhaltungen[0].id);
    }
  }, [buchhaltungen, aktiveId, initialisiert, setAktiveId]);

  const aktive = buchhaltungen.find((b) => b.id === aktiveId);

  const updateAktive = (updater: (b: Buchhaltung) => Buchhaltung) => {
    setBuchhaltungen((prev) => prev.map((b) => (b.id === aktiveId ? updater(b) : b)));
  };

  const handleAnfangsbestandAendern = (anfangsbestand: Anfangsbestand) => {
    updateAktive((b) => ({ ...b, anfangsbestand }));
  };

  const handleBuchungHinzufuegen = (buchung: Buchung) => {
    updateAktive((b) => ({ ...b, buchungen: [...b.buchungen, buchung] }));
  };

  const handleBuchungLoeschen = (id: string) => {
    if (confirm('Buchung wirklich löschen?')) {
      updateAktive((b) => ({ ...b, buchungen: b.buchungen.filter((x) => x.id !== id) }));
    }
  };

  const handleBuchungBearbeiten = (buchung: Buchung) => {
    updateAktive((b) => ({
      ...b,
      buchungen: b.buchungen.map((x) => (x.id === buchung.id ? buchung : x)),
    }));
  };

  const handleGeldtransitHinzufuegen = (geldtransit: Geldtransit) => {
    updateAktive((b) => ({ ...b, geldtransits: [...b.geldtransits, geldtransit] }));
  };

  const handleGeldtransitLoeschen = (id: string) => {
    if (confirm('Geldtransit wirklich löschen?')) {
      updateAktive((b) => ({
        ...b,
        geldtransits: b.geldtransits.filter((x) => x.id !== id),
      }));
    }
  };

  const handleGeldtransitBearbeiten = (geldtransit: Geldtransit) => {
    updateAktive((b) => ({
      ...b,
      geldtransits: b.geldtransits.map((x) =>
        x.id === geldtransit.id ? geldtransit : x,
      ),
    }));
  };

  const neueBuchhaltung = (name: string) => {
    const neu = leereBuchhaltung(name);
    setBuchhaltungen((prev) => [...prev, neu]);
    setAktiveId(neu.id);
  };

  const umbenennen = (id: string, name: string) => {
    setBuchhaltungen((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
  };

  const loeschen = (id: string) => {
    setBuchhaltungen((prev) => {
      const rest = prev.filter((b) => b.id !== id);
      if (rest.length === 0) {
        const neu = leereBuchhaltung(String(new Date().getFullYear()));
        setAktiveId(neu.id);
        return [neu];
      }
      if (id === aktiveId) setAktiveId(rest[0].id);
      return rest;
    });
  };

  if (!aktive) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
        Lädt …
      </div>
    );
  }

  const verfuegbareJahre = [
    ...new Set(aktive.buchungen.map((b) => new Date(b.datum).getFullYear())),
  ];
  if (!verfuegbareJahre.includes(selectedYear)) verfuegbareJahre.push(selectedYear);
  verfuegbareJahre.sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Buchhaltung</h1>
            <p className="text-blue-200 mt-1">Einnahmen-Überschuss-Rechnung für Kleinunternehmer</p>
          </div>
          <BuchhaltungSwitcher
            buchhaltungen={buchhaltungen}
            aktiveId={aktiveId}
            onWechseln={setAktiveId}
            onNeu={neueBuchhaltung}
            onUmbenennen={umbenennen}
            onLoeschen={loeschen}
          />
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('buchungen')}
              className={`py-4 px-6 font-medium transition-colors border-b-2 ${
                activeTab === 'buchungen'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Buchungen
            </button>
            <button
              onClick={() => setActiveTab('eur')}
              className={`py-4 px-6 font-medium transition-colors border-b-2 ${
                activeTab === 'eur'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Einnahmen-Überschuss-Rechnung
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'buchungen' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <AnfangsbestandFormular
                anfangsbestand={aktive.anfangsbestand}
                onAnfangsbestandAendern={handleAnfangsbestandAendern}
              />
              <GeldtransitFormular onGeldtransitHinzufuegen={handleGeldtransitHinzufuegen} />
              <BuchungsFormular onBuchungHinzufuegen={handleBuchungHinzufuegen} />
            </div>
            <div className="lg:col-span-2">
              <BuchungsUebersicht
                buchungen={aktive.buchungen}
                anfangsbestand={aktive.anfangsbestand}
                geldtransits={aktive.geldtransits}
                onBuchungLoeschen={handleBuchungLoeschen}
                onBuchungBearbeiten={handleBuchungBearbeiten}
                onGeldtransitLoeschen={handleGeldtransitLoeschen}
                onGeldtransitBearbeiten={handleGeldtransitBearbeiten}
                buchhaltungName={aktive.name}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <label htmlFor="jahr" className="font-medium text-gray-700">
                Jahr auswählen:
              </label>
              <select
                id="jahr"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {verfuegbareJahre.map((jahr) => (
                  <option key={jahr} value={jahr}>
                    {jahr}
                  </option>
                ))}
              </select>
            </div>
            <EinnahmenUeberschussRechnung buchungen={aktive.buchungen} jahr={selectedYear} />
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>
            Buchhaltung · {buchhaltungen.length}{' '}
            {buchhaltungen.length === 1 ? 'Datei' : 'Dateien'} · Lokale Speicherung im Browser
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {letzteSpeicherung
              ? `Automatisch gespeichert · ${letzteSpeicherung.toLocaleTimeString('de-DE')}`
              : 'Automatische Speicherung aktiv'}
          </span>
        </div>
      </footer>
    </div>
  );
}
