'use client';

import { useState } from 'react';
import { Geldtransit, GeldtransitRichtung } from '@/types';

interface GeldtransitFormularProps {
  onGeldtransitHinzufuegen: (geldtransit: Geldtransit) => void;
}

export default function GeldtransitFormular({ onGeldtransitHinzufuegen }: GeldtransitFormularProps) {
  const [richtung, setRichtung] = useState<GeldtransitRichtung>('bank_zu_kasse');
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [betrag, setBetrag] = useState<number | ''>('');
  const [beschreibung, setBeschreibung] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!betrag || betrag <= 0) return;

    const geldtransit: Geldtransit = {
      id: crypto.randomUUID(),
      datum,
      richtung,
      betrag: Number(betrag),
      beschreibung: beschreibung || (richtung === 'bank_zu_kasse' ? 'Barabhebung' : 'Bareinzahlung'),
    };

    onGeldtransitHinzufuegen(geldtransit);
    setBetrag('');
    setBeschreibung('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Geldtransit</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Richtung</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRichtung('bank_zu_kasse')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                richtung === 'bank_zu_kasse'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bank → Kasse
            </button>
            <button
              type="button"
              onClick={() => setRichtung('kasse_zu_bank')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                richtung === 'kasse_zu_bank'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kasse → Bank
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="transit-datum" className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <input
            id="transit-datum"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="transit-betrag" className="block text-sm font-medium text-gray-700 mb-1">
            Betrag (EUR)
          </label>
          <input
            id="transit-betrag"
            type="number"
            value={betrag}
            onChange={(e) => setBetrag(e.target.value ? parseFloat(e.target.value) : '')}
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="0,00"
            required
          />
        </div>

        <div>
          <label htmlFor="transit-beschreibung" className="block text-sm font-medium text-gray-700 mb-1">
            Beschreibung (optional)
          </label>
          <input
            id="transit-beschreibung"
            type="text"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder={richtung === 'bank_zu_kasse' ? 'Barabhebung' : 'Bareinzahlung'}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
        >
          Geldtransit buchen
        </button>
      </form>
    </div>
  );
}
