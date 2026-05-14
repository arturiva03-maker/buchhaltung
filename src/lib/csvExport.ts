import {
  Buchung,
  Geldtransit,
  KONTEN,
  ZAHLUNGSMITTEL,
  GELDTRANSIT_KONTO,
} from '@/types';

interface CsvZeile {
  datum: string;
  beleg: string;
  buchungstext: string;
  betrag: number;
  sollKontoNr: string;
  sollKontoName: string;
  habenKontoNr: string;
  habenKontoName: string;
  typ: 'Einnahme' | 'Ausgabe' | 'Geldtransit';
}

const formatDatum = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const formatBetrag = (n: number) =>
  n.toFixed(2).replace('.', ',');

const escape = (val: string) => {
  if (val.includes('"') || val.includes(';') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

const kontoFuer = (id: string) => KONTEN.find((k) => k.id === id);
const zahlungsmittelFuer = (id: string) =>
  ZAHLUNGSMITTEL.find((z) => z.id === id);

function buchungZuZeile(b: Buchung): CsvZeile | null {
  const konto = kontoFuer(b.konto);
  const zm = zahlungsmittelFuer(b.zahlungsmittel);
  if (!konto || !zm) return null;

  // Doppelte Buchführung:
  //   Einnahme → Soll: Zahlungsmittel, Haben: Erlöskonto
  //   Ausgabe  → Soll: Aufwandskonto, Haben: Zahlungsmittel
  if (b.typ === 'einnahme') {
    return {
      datum: b.datum,
      beleg: b.id.slice(0, 8),
      buchungstext: b.beschreibung,
      betrag: b.betrag,
      sollKontoNr: zm.nummer,
      sollKontoName: zm.name,
      habenKontoNr: konto.nummer,
      habenKontoName: konto.name,
      typ: 'Einnahme',
    };
  }
  return {
    datum: b.datum,
    beleg: b.id.slice(0, 8),
    buchungstext: b.beschreibung,
    betrag: b.betrag,
    sollKontoNr: konto.nummer,
    sollKontoName: konto.name,
    habenKontoNr: zm.nummer,
    habenKontoName: zm.name,
    typ: 'Ausgabe',
  };
}

function transitZuZeile(g: Geldtransit): CsvZeile {
  const bank = zahlungsmittelFuer('bank')!;
  const kasse = zahlungsmittelFuer('kasse')!;
  // Direkte Umbuchung über das Geldtransitkonto wäre zweizeilig — wir buchen
  // direkt von Zahlungsmittel zu Zahlungsmittel und verweisen im Buchungstext
  // auf das SKR03-Geldtransitkonto.
  if (g.richtung === 'bank_zu_kasse') {
    return {
      datum: g.datum,
      beleg: g.id.slice(0, 8),
      buchungstext: `${g.beschreibung} (Geldtransit ${GELDTRANSIT_KONTO.nummer})`,
      betrag: g.betrag,
      sollKontoNr: kasse.nummer,
      sollKontoName: kasse.name,
      habenKontoNr: bank.nummer,
      habenKontoName: bank.name,
      typ: 'Geldtransit',
    };
  }
  return {
    datum: g.datum,
    beleg: g.id.slice(0, 8),
    buchungstext: `${g.beschreibung} (Geldtransit ${GELDTRANSIT_KONTO.nummer})`,
    betrag: g.betrag,
    sollKontoNr: bank.nummer,
    sollKontoName: bank.name,
    habenKontoNr: kasse.nummer,
    habenKontoName: kasse.name,
    typ: 'Geldtransit',
  };
}

export function buchungenZuCsv(
  buchungen: Buchung[],
  geldtransits: Geldtransit[],
): string {
  const zeilen: CsvZeile[] = [
    ...buchungen.map(buchungZuZeile).filter((z): z is CsvZeile => z !== null),
    ...geldtransits.map(transitZuZeile),
  ].sort(
    (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime(),
  );

  const header = [
    'Datum',
    'Beleg-Nr',
    'Buchungstext',
    'Betrag (EUR)',
    'Soll-Konto-Nr',
    'Soll-Konto',
    'Haben-Konto-Nr',
    'Haben-Konto',
    'Typ',
  ];

  const rows = zeilen.map((z) =>
    [
      formatDatum(z.datum),
      z.beleg,
      z.buchungstext,
      formatBetrag(z.betrag),
      z.sollKontoNr,
      z.sollKontoName,
      z.habenKontoNr,
      z.habenKontoName,
      z.typ,
    ]
      .map(escape)
      .join(';'),
  );

  // BOM, damit Excel UTF-8 + Umlaute erkennt
  return '\uFEFF' + [header.join(';'), ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
