'use client';

import { Buchung, KONTEN } from '@/types';

interface EURProps {
  buchungen: Buchung[];
  jahr: number;
}

export default function EinnahmenUeberschussRechnung({ buchungen, jahr }: EURProps) {
  const formatBetrag = (betrag: number) => {
    return betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  // Buchungen für das ausgewählte Jahr filtern
  const jahresBuchungen = buchungen.filter(b => new Date(b.datum).getFullYear() === jahr);

  // Einnahmen berechnen
  const einnahmenKonten = KONTEN.filter(k => k.typ === 'einnahme');
  const einnahmenSummen = einnahmenKonten.map(konto => {
    const summe = jahresBuchungen
      .filter(b => b.konto === konto.id && b.typ === 'einnahme')
      .reduce((sum, b) => sum + b.betrag, 0);
    return { konto, summe };
  });
  const gesamtEinnahmen = einnahmenSummen.reduce((sum, e) => sum + e.summe, 0);

  // Ausgaben berechnen
  const ausgabenKonten = KONTEN.filter(k => k.typ === 'ausgabe');
  const ausgabenSummen = ausgabenKonten.map(konto => {
    const summe = jahresBuchungen
      .filter(b => b.konto === konto.id && b.typ === 'ausgabe')
      .reduce((sum, b) => sum + b.betrag, 0);
    return { konto, summe };
  });
  const gesamtAusgaben = ausgabenSummen.reduce((sum, a) => sum + a.summe, 0);

  // Gewinn/Verlust
  const gewinnVerlust = gesamtEinnahmen - gesamtAusgaben;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Einnahmen-Überschuss-Rechnung {jahr}
      </h2>

      {/* Einnahmen */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-700 mb-3 border-b border-green-200 pb-2">
          Betriebseinnahmen
        </h3>
        <table className="w-full">
          <tbody>
            {einnahmenSummen.map(({ konto, summe }) => (
              <tr key={konto.id} className={summe === 0 ? 'text-gray-400' : ''}>
                <td className="py-1 text-gray-700">{konto.name}</td>
                <td className="py-1 text-right text-gray-800">{formatBetrag(summe)}</td>
              </tr>
            ))}
            <tr className="border-t border-green-200 font-bold">
              <td className="py-2 text-green-700">Summe Einnahmen</td>
              <td className="py-2 text-right text-green-700">{formatBetrag(gesamtEinnahmen)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ausgaben */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-red-700 mb-3 border-b border-red-200 pb-2">
          Betriebsausgaben
        </h3>
        <table className="w-full">
          <tbody>
            {ausgabenSummen.map(({ konto, summe }) => (
              <tr key={konto.id} className={summe === 0 ? 'text-gray-400' : ''}>
                <td className="py-1 text-gray-700">{konto.name}</td>
                <td className="py-1 text-right text-gray-800">{formatBetrag(summe)}</td>
              </tr>
            ))}
            <tr className="border-t border-red-200 font-bold">
              <td className="py-2 text-red-700">Summe Ausgaben</td>
              <td className="py-2 text-right text-red-700">{formatBetrag(gesamtAusgaben)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ergebnis */}
      <div className={`p-4 rounded-lg ${gewinnVerlust >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
        <div className="flex justify-between items-center">
          <span className={`text-lg font-bold ${gewinnVerlust >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {gewinnVerlust >= 0 ? 'Gewinn' : 'Verlust'}
          </span>
          <span className={`text-2xl font-bold ${gewinnVerlust >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {formatBetrag(Math.abs(gewinnVerlust))}
          </span>
        </div>
      </div>

      {/* Hinweis Kleinunternehmer */}
      <p className="mt-4 text-xs text-gray-500">
        * Einnahmen-Überschuss-Rechnung nach § 4 Abs. 3 EStG für Kleinunternehmer nach § 19 UStG
      </p>
    </div>
  );
}
