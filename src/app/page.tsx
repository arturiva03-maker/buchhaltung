'use client';

import { useState } from 'react';
import { Buchung } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import BuchungsFormular from '@/components/BuchungsFormular';
import BuchungsUebersicht from '@/components/BuchungsUebersicht';
import EinnahmenUeberschussRechnung from '@/components/EinnahmenUeberschussRechnung';

type Tab = 'buchungen' | 'eur';

export default function Home() {
  const [buchungen, setBuchungen] = useLocalStorage<Buchung[]>('buchungen', []);
  const [activeTab, setActiveTab] = useState<Tab>('buchungen');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleBuchungHinzufuegen = (buchung: Buchung) => {
    setBuchungen((prev) => [...prev, buchung]);
  };

  const handleBuchungLoeschen = (id: string) => {
    if (confirm('Buchung wirklich löschen?')) {
      setBuchungen((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleBuchungBearbeiten = (buchung: Buchung) => {
    setBuchungen((prev) => prev.map((b) => b.id === buchung.id ? buchung : b));
  };

  const verfuegbareJahre = [...new Set(buchungen.map(b => new Date(b.datum).getFullYear()))];
  if (!verfuegbareJahre.includes(selectedYear)) {
    verfuegbareJahre.push(selectedYear);
  }
  verfuegbareJahre.sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Buchhaltung</h1>
          <p className="text-blue-200 mt-1">Einnahmen-Überschuss-Rechnung für Kleinunternehmer</p>
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
              <BuchungsFormular onBuchungHinzufuegen={handleBuchungHinzufuegen} />
            </div>
            <div className="lg:col-span-2">
              <BuchungsUebersicht
                buchungen={buchungen}
                onBuchungLoeschen={handleBuchungLoeschen}
                onBuchungBearbeiten={handleBuchungBearbeiten}
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
            <EinnahmenUeberschussRechnung buchungen={buchungen} jahr={selectedYear} />
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          Buchhaltung - Lokale Speicherung im Browser
        </div>
      </footer>
    </div>
  );
}
