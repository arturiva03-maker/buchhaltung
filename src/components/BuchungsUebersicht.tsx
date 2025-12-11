'use client';

import { Buchung, KONTEN, ZAHLUNGSMITTEL } from '@/types';

interface BuchungsUebersichtProps {
  buchungen: Buchung[];
  onBuchungLoeschen: (id: string) => void;
}

export default function BuchungsUebersicht({ buchungen, onBuchungLoeschen }: BuchungsUebersichtProps) {
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

  // Saldo berechnen
  const bankSaldo = buchungen
    .filter(b => b.zahlungsmittel === 'bank')
    .reduce((sum, b) => sum + (b.typ === 'einnahme' ? b.betrag : -b.betrag), 0);

  const kasseSaldo = buchungen
    .filter(b => b.zahlungsmittel === 'kasse')
    .reduce((sum, b) => sum + (b.typ === 'einnahme' ? b.betrag : -b.betrag), 0);

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
                <th className="text-center py-2 px-2 text-gray-600">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {sortedBuchungen.map((buchung) => (
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
                    <button
                      onClick={() => onBuchungLoeschen(buchung.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Buchung löschen"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
