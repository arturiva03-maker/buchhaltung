'use client';

import { useState } from 'react';
import { Buchung, BuchungsKonto, ZahlungsmittelKonto, BuchungsTyp, KONTEN, ZAHLUNGSMITTEL } from '@/types';

interface BuchungsUebersichtProps {
  buchungen: Buchung[];
  onBuchungLoeschen: (id: string) => void;
  onBuchungBearbeiten: (buchung: Buchung) => void;
}

export default function BuchungsUebersicht({ buchungen, onBuchungLoeschen, onBuchungBearbeiten }: BuchungsUebersichtProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Buchung | null>(null);

  const getKontoName = (kontoId: string) => {
    return KONTEN.find(k => k.id === kontoId)?.name || kontoId;
  };

  const getZahlungsmittelName = (zmId: string) => {
    return ZAHLUNGSMITTEL.find(zm => zm.id === zmId)?.name || zmId;
  };

  const formatBetrag = (betrag: number) => {
    return betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const formatDatum = (datum: string) => {
    return new Date(datum).toLocaleDateString('de-DE');
  };

  const sortedBuchungen = [...buchungen].sort(
    (a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()
  );

  const bankSaldo = buchungen
    .filter(b => b.zahlungsmittel === 'bank')
    .reduce((sum, b) => sum + (b.typ === 'einnahme' ? b.betrag : -b.betrag), 0);

  const kasseSaldo = buchungen
    .filter(b => b.zahlungsmittel === 'kasse')
    .reduce((sum, b) => sum + (b.typ === 'einnahme' ? b.betrag : -b.betrag), 0);

  const startEditing = (buchung: Buchung) => {
    setEditingId(buchung.id);
    setEditForm({ ...buchung });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEditing = () => {
    if (editForm) {
      onBuchungBearbeiten(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleTypChange = (neuerTyp: BuchungsTyp) => {
    if (!editForm) return;
    const verfuegbareKonten = KONTEN.filter(k => k.typ === neuerTyp);
    const ersteVerfuegbareKonto = verfuegbareKonten[0];
    setEditForm({
      ...editForm,
      typ: neuerTyp,
      konto: ersteVerfuegbareKonto?.id || editForm.konto
    });
  };

  const verfuegbareKonten = editForm ? KONTEN.filter(k => k.typ === editForm.typ) : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Buchungsübersicht</h2>

      {/* Salden */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Bank</p>
          <p className={`text-2xl font-bold ${bankSaldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatBetrag(bankSaldo)}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 font-medium">Kasse</p>
          <p className={`text-2xl font-bold ${kasseSaldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatBetrag(kasseSaldo)}
          </p>
        </div>
      </div>

      {/* Buchungsliste */}
      {sortedBuchungen.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Noch keine Buchungen vorhanden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-600">Datum</th>
                <th className="text-left py-2 px-2 text-gray-600">Beschreibung</th>
                <th className="text-left py-2 px-2 text-gray-600">Konto</th>
                <th className="text-left py-2 px-2 text-gray-600">Zahlungsmittel</th>
                <th className="text-right py-2 px-2 text-gray-600">Betrag</th>
                <th className="text-center py-2 px-2 text-gray-600">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {sortedBuchungen.map((buchung) => (
                editingId === buchung.id && editForm ? (
                  <tr key={buchung.id} className="border-b border-gray-100 bg-blue-50">
                    <td className="py-2 px-2">
                      <input
                        type="date"
                        value={editForm.datum}
                        onChange={(e) => setEditForm({ ...editForm, datum: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={editForm.beschreibung}
                        onChange={(e) => setEditForm({ ...editForm, beschreibung: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col gap-1">
                        <select
                          value={editForm.typ}
                          onChange={(e) => handleTypChange(e.target.value as BuchungsTyp)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                        >
                          <option value="einnahme">Einnahme</option>
                          <option value="ausgabe">Ausgabe</option>
                        </select>
                        <select
                          value={editForm.konto}
                          onChange={(e) => setEditForm({ ...editForm, konto: e.target.value as BuchungsKonto })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                        >
                          {verfuegbareKonten.map((k) => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={editForm.zahlungsmittel}
                        onChange={(e) => setEditForm({ ...editForm, zahlungsmittel: e.target.value as ZahlungsmittelKonto })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                      >
                        {ZAHLUNGSMITTEL.map((zm) => (
                          <option key={zm.id} value={zm.id}>{zm.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={editForm.betrag}
                        onChange={(e) => setEditForm({ ...editForm, betrag: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        min="0.01"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm text-right"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={saveEditing}
                          className="text-green-600 hover:text-green-800 transition-colors font-medium"
                          title="Speichern"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title="Abbrechen"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={buchung.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-800">{formatDatum(buchung.datum)}</td>
                    <td className="py-2 px-2 text-gray-800">{buchung.beschreibung}</td>
                    <td className="py-2 px-2 text-gray-800">{getKontoName(buchung.konto)}</td>
                    <td className="py-2 px-2 text-gray-800">{getZahlungsmittelName(buchung.zahlungsmittel)}</td>
                    <td className={`py-2 px-2 text-right font-medium ${
                      buchung.typ === 'einnahme' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {buchung.typ === 'einnahme' ? '+' : '-'}{formatBetrag(buchung.betrag)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => startEditing(buchung)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Buchung bearbeiten"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => onBuchungLoeschen(buchung.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Buchung löschen"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
