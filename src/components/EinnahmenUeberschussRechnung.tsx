'use client';

import { useState } from 'react';
import { Buchung, BuchungsKonto, KONTEN, ZAHLUNGSMITTEL } from '@/types';

// Konten, die nicht in die EÜR einfließen — Privatbewegungen und
// durchlaufende Posten sind erfolgsneutral.
const NEUTRALE_KONTEN: BuchungsKonto[] = [
  'privatentnahme',
  'sonderausgaben',
  'privateinlage',
  'durchlaufende_posten_ein',
  'durchlaufende_posten_aus',
];

interface EURProps {
  buchungen: Buchung[];
  jahr: number;
}

export default function EinnahmenUeberschussRechnung({ buchungen, jahr }: EURProps) {
  const [offeneKonten, setOffeneKonten] = useState<Set<BuchungsKonto>>(new Set());

  const formatBetrag = (betrag: number) => {
    return betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const formatDatum = (datum: string) =>
    new Date(datum).toLocaleDateString('de-DE');

  const getZahlungsmittelName = (id: string) =>
    ZAHLUNGSMITTEL.find((z) => z.id === id)?.name ?? id;

  // Buchungen für das ausgewählte Jahr filtern
  const jahresBuchungen = buchungen.filter(b => new Date(b.datum).getFullYear() === jahr);

  // Einnahmen berechnen
  const einnahmenKonten = KONTEN.filter(
    k => k.typ === 'einnahme' && !NEUTRALE_KONTEN.includes(k.id),
  );
  const einnahmenSummen = einnahmenKonten.map(konto => {
    const kontoBuchungen = jahresBuchungen.filter(
      b => b.konto === konto.id && b.typ === 'einnahme',
    );
    const summe = kontoBuchungen.reduce((sum, b) => sum + b.betrag, 0);
    return { konto, summe, buchungen: kontoBuchungen };
  });
  const gesamtEinnahmen = einnahmenSummen.reduce((sum, e) => sum + e.summe, 0);

  // Ausgaben berechnen
  const ausgabenKonten = KONTEN.filter(
    k => k.typ === 'ausgabe' && !NEUTRALE_KONTEN.includes(k.id),
  );
  const ausgabenSummen = ausgabenKonten.map(konto => {
    const kontoBuchungen = jahresBuchungen.filter(
      b => b.konto === konto.id && b.typ === 'ausgabe',
    );
    const summe = kontoBuchungen.reduce((sum, b) => sum + b.betrag, 0);
    return { konto, summe, buchungen: kontoBuchungen };
  });
  const gesamtAusgaben = ausgabenSummen.reduce((sum, a) => sum + a.summe, 0);

  // Gewinn/Verlust
  const gewinnVerlust = gesamtEinnahmen - gesamtAusgaben;

  const toggleKonto = (id: BuchungsKonto) => {
    setOffeneKonten((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 'kompakt' druckt nur die Konten-Summen, 'detail' inkl. aller Unterbuchungen.
  // Die Klasse am Root steuert per CSS, ob die collapsed Detailzeilen im
  // Druckbild eingeblendet werden.
  const drucken = (modus: 'kompakt' | 'detail') => {
    if (typeof document === 'undefined') return;
    const root = document.querySelector('.eur-print-root');
    if (!root) return;
    root.classList.add(modus === 'detail' ? 'print-detail' : 'print-kompakt');
    const aufraeumen = () => {
      root.classList.remove('print-detail');
      root.classList.remove('print-kompakt');
      window.removeEventListener('afterprint', aufraeumen);
    };
    window.addEventListener('afterprint', aufraeumen);
    window.print();
  };

  const renderKontoZeilen = (
    summen: { konto: typeof KONTEN[number]; summe: number; buchungen: Buchung[] }[],
    farbe: 'green' | 'red',
  ) =>
    summen.flatMap(({ konto, summe, buchungen }) => {
      const offen = offeneKonten.has(konto.id);
      const hatBuchungen = buchungen.length > 0;
      return [
        <tr
          key={konto.id}
          className={`${summe === 0 ? 'text-gray-400' : ''} ${
            hatBuchungen ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={() => hatBuchungen && toggleKonto(konto.id)}
        >
          <td className="py-1 text-gray-700">
            <span className="inline-block w-4 text-gray-400 no-print">
              {hatBuchungen ? (offen ? '▾' : '▸') : ''}
            </span>
            <span className="font-mono text-xs text-gray-500 mr-2">{konto.nummer}</span>
            {konto.name}
            {hatBuchungen && (
              <span className="ml-2 text-xs text-gray-400">
                ({buchungen.length})
              </span>
            )}
          </td>
          <td className="py-1 text-right text-gray-800">{formatBetrag(summe)}</td>
        </tr>,
        ...(hatBuchungen
          ? [
              <tr
                key={`${konto.id}-detail`}
                className={`detail-row bg-gray-50 ${offen ? '' : 'screen-collapsed'}`}
              >
                <td colSpan={2} className="py-2 px-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-200">
                        <th className="text-left py-1 font-normal">Datum</th>
                        <th className="text-left py-1 font-normal">Beschreibung</th>
                        <th className="text-left py-1 font-normal">Zahlungsmittel</th>
                        <th className="text-right py-1 font-normal">Betrag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...buchungen]
                        .sort((a, b) => a.datum.localeCompare(b.datum))
                        .map((b) => (
                          <tr key={b.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-1 text-gray-700">{formatDatum(b.datum)}</td>
                            <td className="py-1 text-gray-700">{b.beschreibung}</td>
                            <td className="py-1 text-gray-600">
                              {getZahlungsmittelName(b.zahlungsmittel)}
                            </td>
                            <td
                              className={`py-1 text-right font-medium text-${farbe}-700`}
                            >
                              {formatBetrag(b.betrag)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </td>
              </tr>,
            ]
          : []),
      ];
    });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md eur-print-root">
      <style jsx global>{`
        .screen-collapsed {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .eur-print-root,
          .eur-print-root * {
            visibility: visible;
          }
          .eur-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          /* Detail-Modus: alle Detailzeilen einblenden, unabhängig vom Toggle */
          .eur-print-root.print-detail .screen-collapsed {
            display: table-row !important;
          }
          /* Kompakt-Modus: aufgeklappte Detailzeilen ebenfalls ausblenden */
          .eur-print-root.print-kompakt .detail-row {
            display: none !important;
          }
          .detail-row {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Einnahmen-Überschuss-Rechnung {jahr}
        </h2>
        <div className="flex gap-2 no-print">
          <button
            onClick={() => {
              const alle = new Set<BuchungsKonto>([
                ...einnahmenSummen.filter((s) => s.buchungen.length).map((s) => s.konto.id),
                ...ausgabenSummen.filter((s) => s.buchungen.length).map((s) => s.konto.id),
              ]);
              setOffeneKonten(
                offeneKonten.size === alle.size ? new Set() : alle,
              );
            }}
            className="px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Alle aufklappen/zuklappen
          </button>
          <button
            onClick={() => drucken('kompakt')}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Drucken (Übersicht)
          </button>
          <button
            onClick={() => drucken('detail')}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 transition-colors"
          >
            Drucken (mit Details)
          </button>
        </div>
      </div>

      {/* Einnahmen */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-700 mb-3 border-b border-green-200 pb-2">
          Betriebseinnahmen
        </h3>
        <table className="w-full">
          <tbody>
            {renderKontoZeilen(einnahmenSummen, 'green')}
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
            {renderKontoZeilen(ausgabenSummen, 'red')}
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
