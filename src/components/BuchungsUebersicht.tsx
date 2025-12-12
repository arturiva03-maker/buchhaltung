'use client';

import { useState } from 'react';
import { Buchung, BuchungsKonto, ZahlungsmittelKonto, BuchungsTyp, Anfangsbestand, Geldtransit, GeldtransitRichtung, KONTEN, ZAHLUNGSMITTEL } from '@/types';

interface BuchungsUebersichtProps {
  buchungen: Buchung[];
  anfangsbestand: Anfangsbestand;
  geldtransits: Geldtransit[];
  onBuchungLoeschen: (id: string) => void;
  onBuchungBearbeiten: (buchung: Buchung) => void;
  onGeldtransitLoeschen: (id: string) => void;
  onGeldtransitBearbeiten: (geldtransit: Geldtransit) => void;
}

type EintragTyp =
  | { art: 'buchung'; daten: Buchung }
  | { art: 'geldtransit'; daten: Geldtransit };

export default function BuchungsUebersicht({
  buchungen,
  anfangsbestand,
  geldtransits,
  onBuchungLoeschen,
  onBuchungBearbeiten,
  onGeldtransitLoeschen,
  onGeldtransitBearbeiten,
}: BuchungsUebersichtProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'buchung' | 'geldtransit' | null>(null);
  const [editBuchungForm, setEditBuchungForm] = useState<Buchung | null>(null);
  const [editGeldtransitForm, setEditGeldtransitForm] = useState<Geldtransit | null>(null);

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

  // Alle Einträge zusammenführen und nach Datum sortieren
  const alleEintraege: EintragTyp[] = [
    ...buchungen.map(b => ({ art: 'buchung' as const, daten: b })),
    ...geldtransits.map(g => ({ art: 'geldtransit' as const, daten: g })),
  ].sort((a, b) => new Date(b.daten.datum).getTime() - new Date(a.daten.datum).getTime());

  // Saldo-Berechnung mit Geldtransits
  const bankSaldoAusBuchungen = buchungen
    .filter(b => b.zahlungsmittel === 'bank')
    .reduce((sum, b) => sum + (b.typ === 'einnahme' ? b.betrag : -b.betrag), 0);

  const bankSaldoAusTransits = geldtransits
    .reduce((sum, g) => {
      if (g.richtung === 'kasse_zu_bank') return sum + g.betrag;
      if (g.richtung === 'bank_zu_kasse') return sum - g.betrag;
      return sum;
    }, 0);

  const bankSaldo = anfangsbestand.bank + bankSaldoAusBuchungen + bankSaldoAusTransits;

  const kasseSaldoAusBuchungen = buchungen
    .filter(b => b.zahlungsmittel === 'kasse')
    .reduce((sum, b) => sum + (b.typ === 'einnahme' ? b.betrag : -b.betrag), 0);

  const kasseSaldoAusTransits = geldtransits
    .reduce((sum, g) => {
      if (g.richtung === 'bank_zu_kasse') return sum + g.betrag;
      if (g.richtung === 'kasse_zu_bank') return sum - g.betrag;
      return sum;
    }, 0);

  const kasseSaldo = anfangsbestand.kasse + kasseSaldoAusBuchungen + kasseSaldoAusTransits;

  // Buchung bearbeiten
  const startEditingBuchung = (buchung: Buchung) => {
    setEditingId(buchung.id);
    setEditingType('buchung');
    setEditBuchungForm({ ...buchung });
    setEditGeldtransitForm(null);
  };

  // Geldtransit bearbeiten
  const startEditingGeldtransit = (geldtransit: Geldtransit) => {
    setEditingId(geldtransit.id);
    setEditingType('geldtransit');
    setEditGeldtransitForm({ ...geldtransit });
    setEditBuchungForm(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingType(null);
    setEditBuchungForm(null);
    setEditGeldtransitForm(null);
  };

  const saveEditingBuchung = () => {
    if (editBuchungForm) {
      onBuchungBearbeiten(editBuchungForm);
      cancelEditing();
    }
  };

  const saveEditingGeldtransit = () => {
    if (editGeldtransitForm) {
      onGeldtransitBearbeiten(editGeldtransitForm);
      cancelEditing();
    }
  };

  const handleTypChange = (neuerTyp: BuchungsTyp) => {
    if (!editBuchungForm) return;
    const verfuegbareKonten = KONTEN.filter(k => k.typ === neuerTyp);
    const ersteVerfuegbareKonto = verfuegbareKonten[0];
    setEditBuchungForm({
      ...editBuchungForm,
      typ: neuerTyp,
      konto: ersteVerfuegbareKonto?.id || editBuchungForm.konto
    });
  };

  const verfuegbareKonten = editBuchungForm ? KONTEN.filter(k => k.typ === editBuchungForm.typ) : [];

  const getRichtungText = (richtung: GeldtransitRichtung) => {
    return richtung === 'bank_zu_kasse' ? 'Bank → Kasse' : 'Kasse → Bank';
  };

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

      {/* Liste */}
      {alleEintraege.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Noch keine Buchungen vorhanden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-gray-600">Datum</th>
                <th className="text-left py-2 px-2 text-gray-600">Beschreibung</th>
                <th className="text-left py-2 px-2 text-gray-600">Konto/Transit</th>
                <th className="text-left py-2 px-2 text-gray-600">Zahlungsmittel</th>
                <th className="text-right py-2 px-2 text-gray-600">Betrag</th>
                <th className="text-center py-2 px-2 text-gray-600">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {alleEintraege.map((eintrag) => {
                if (eintrag.art === 'buchung') {
                  const buchung = eintrag.daten;
                  const isEditing = editingId === buchung.id && editingType === 'buchung';

                  if (isEditing && editBuchungForm) {
                    return (
                      <tr key={`buchung-${buchung.id}`} className="border-b border-gray-100 bg-blue-50">
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            value={editBuchungForm.datum}
                            onChange={(e) => setEditBuchungForm({ ...editBuchungForm, datum: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editBuchungForm.beschreibung}
                            onChange={(e) => setEditBuchungForm({ ...editBuchungForm, beschreibung: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col gap-1">
                            <select
                              value={editBuchungForm.typ}
                              onChange={(e) => handleTypChange(e.target.value as BuchungsTyp)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                            >
                              <option value="einnahme">Einnahme</option>
                              <option value="ausgabe">Ausgabe</option>
                            </select>
                            <select
                              value={editBuchungForm.konto}
                              onChange={(e) => setEditBuchungForm({ ...editBuchungForm, konto: e.target.value as BuchungsKonto })}
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
                            value={editBuchungForm.zahlungsmittel}
                            onChange={(e) => setEditBuchungForm({ ...editBuchungForm, zahlungsmittel: e.target.value as ZahlungsmittelKonto })}
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
                            value={editBuchungForm.betrag}
                            onChange={(e) => setEditBuchungForm({ ...editBuchungForm, betrag: parseFloat(e.target.value) || 0 })}
                            step="0.01"
                            min="0.01"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm text-right"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={saveEditingBuchung}
                              className="text-green-600 hover:text-green-800 transition-colors font-medium"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`buchung-${buchung.id}`} className="border-b border-gray-100 hover:bg-gray-50">
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
                            onClick={() => startEditingBuchung(buchung)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => onBuchungLoeschen(buchung.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  // Geldtransit
                  const transit = eintrag.daten;
                  const isEditing = editingId === transit.id && editingType === 'geldtransit';

                  if (isEditing && editGeldtransitForm) {
                    return (
                      <tr key={`transit-${transit.id}`} className="border-b border-gray-100 bg-purple-50">
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            value={editGeldtransitForm.datum}
                            onChange={(e) => setEditGeldtransitForm({ ...editGeldtransitForm, datum: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={editGeldtransitForm.beschreibung}
                            onChange={(e) => setEditGeldtransitForm({ ...editGeldtransitForm, beschreibung: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={editGeldtransitForm.richtung}
                            onChange={(e) => setEditGeldtransitForm({ ...editGeldtransitForm, richtung: e.target.value as GeldtransitRichtung })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm"
                          >
                            <option value="bank_zu_kasse">Bank → Kasse</option>
                            <option value="kasse_zu_bank">Kasse → Bank</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-gray-500 text-center">—</td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={editGeldtransitForm.betrag}
                            onChange={(e) => setEditGeldtransitForm({ ...editGeldtransitForm, betrag: parseFloat(e.target.value) || 0 })}
                            step="0.01"
                            min="0.01"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-sm text-right"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={saveEditingGeldtransit}
                              className="text-green-600 hover:text-green-800 transition-colors font-medium"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`transit-${transit.id}`} className="border-b border-gray-100 hover:bg-purple-50 bg-purple-50/30">
                      <td className="py-2 px-2 text-gray-800">{formatDatum(transit.datum)}</td>
                      <td className="py-2 px-2 text-gray-800">{transit.beschreibung}</td>
                      <td className="py-2 px-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {getRichtungText(transit.richtung)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-500 text-center">—</td>
                      <td className="py-2 px-2 text-right font-medium text-purple-600">
                        {formatBetrag(transit.betrag)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => startEditingGeldtransit(transit)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => onGeldtransitLoeschen(transit.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
