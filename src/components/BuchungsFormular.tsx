'use client';

import { useState } from 'react';
import { Buchung, BuchungsKonto, BuchungsTyp, ZahlungsmittelKonto, KONTEN, ZAHLUNGSMITTEL } from '@/types';

interface BuchungsFormularProps {
  onBuchungHinzufuegen: (buchung: Buchung) => void;
}

export default function BuchungsFormular({ onBuchungHinzufuegen }: BuchungsFormularProps) {
  const [typ, setTyp] = useState<BuchungsTyp>('einnahme');
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [betrag, setBetrag] = useState('');
  const [zahlungsmittel, setZahlungsmittel] = useState<ZahlungsmittelKonto>('bank');
  const [konto, setKonto] = useState<BuchungsKonto>('erloese_kleinunternehmer');
  const [beschreibung, setBeschreibung] = useState('');

  const verfuegbareKonten = KONTEN.filter(k => k.typ === typ);

  const handleTypChange = (neuerTyp: BuchungsTyp) => {
    setTyp(neuerTyp);
    const ersteVerfuegbareKonto = KONTEN.find(k => k.typ === neuerTyp);
    if (ersteVerfuegbareKonto) {
      setKonto(ersteVerfuegbareKonto.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const neueBuchung: Buchung = {
      id: crypto.randomUUID(),
      datum,
      typ,
      betrag: parseFloat(betrag),
      zahlungsmittel,
      konto,
      beschreibung,
    };

    onBuchungHinzufuegen(neueBuchung);

    // Formular zurücksetzen
    setBetrag('');
    setBeschreibung('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Neue Buchung</h2>

      {/* Buchungstyp */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Buchungstyp</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleTypChange('einnahme')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              typ === 'einnahme'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Einnahme
          </button>
          <button
            type="button"
            onClick={() => handleTypChange('ausgabe')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              typ === 'ausgabe'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ausgabe
          </button>
        </div>
      </div>

      {/* Datum */}
      <div className="mb-4">
        <label htmlFor="datum" className="block text-sm font-medium text-gray-700 mb-1">
          Datum
        </label>
        <input
          type="date"
          id="datum"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          required
        />
      </div>

      {/* Betrag */}
      <div className="mb-4">
        <label htmlFor="betrag" className="block text-sm font-medium text-gray-700 mb-1">
          Betrag (€)
        </label>
        <input
          type="number"
          id="betrag"
          value={betrag}
          onChange={(e) => setBetrag(e.target.value)}
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="0,00"
          required
        />
      </div>

      {/* Zahlungsmittel */}
      <div className="mb-4">
        <label htmlFor="zahlungsmittel" className="block text-sm font-medium text-gray-700 mb-1">
          Zahlungsmittel
        </label>
        <select
          id="zahlungsmittel"
          value={zahlungsmittel}
          onChange={(e) => setZahlungsmittel(e.target.value as ZahlungsmittelKonto)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          {ZAHLUNGSMITTEL.map((zm) => (
            <option key={zm.id} value={zm.id}>
              {zm.name}
            </option>
          ))}
        </select>
      </div>

      {/* Konto */}
      <div className="mb-4">
        <label htmlFor="konto" className="block text-sm font-medium text-gray-700 mb-1">
          Konto
        </label>
        <select
          id="konto"
          value={konto}
          onChange={(e) => setKonto(e.target.value as BuchungsKonto)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          {verfuegbareKonten.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </div>

      {/* Beschreibung */}
      <div className="mb-4">
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung
        </label>
        <input
          type="text"
          id="beschreibung"
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Beschreibung der Buchung"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Buchung hinzufügen
      </button>
    </form>
  );
}
