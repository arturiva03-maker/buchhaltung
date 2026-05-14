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

// ── Import ───────────────────────────────────────────────────────────

export interface CsvImportResult {
  buchungen: Buchung[];
  geldtransits: Geldtransit[];
  fehler: string[];
}

const parseDatum = (s: string): string | null => {
  // Akzeptiert "TT.MM.JJJJ" (deutscher Export) und ISO "YYYY-MM-DD"
  const trimmed = s.trim();
  const de = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (de) return `${de[3]}-${de[2]}-${de[1]}`;
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return trimmed;
  return null;
};

const parseBetrag = (s: string): number | null => {
  const n = parseFloat(s.trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Eine CSV-Zeile in Felder zerlegen — beachtet "..."-Quoting mit ""-Escape
const splitCsvZeile = (zeile: string): string[] => {
  const felder: string[] = [];
  let aktuell = '';
  let inQuotes = false;
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i];
    if (inQuotes) {
      if (c === '"' && zeile[i + 1] === '"') {
        aktuell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        aktuell += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ';') {
        felder.push(aktuell);
        aktuell = '';
      } else aktuell += c;
    }
  }
  felder.push(aktuell);
  return felder;
};

const zahlungsmittelFuerNummer = (nr: string) =>
  ZAHLUNGSMITTEL.find((z) => z.nummer === nr);

export function csvZuBuchungen(csv: string): CsvImportResult {
  const fehler: string[] = [];
  const buchungen: Buchung[] = [];
  const geldtransits: Geldtransit[] = [];

  // BOM entfernen, Zeilen splitten, leere Zeilen ignorieren
  const text = csv.replace(/^\uFEFF/, '');
  const zeilen = text.split(/\r?\n/).filter((z) => z.trim().length > 0);
  if (zeilen.length < 2) {
    fehler.push('CSV enthält keine Datenzeilen.');
    return { buchungen, geldtransits, fehler };
  }

  // Erste Zeile = Header — wir akzeptieren die Spalten-Reihenfolge unseres Exports
  for (let i = 1; i < zeilen.length; i++) {
    const felder = splitCsvZeile(zeilen[i]);
    if (felder.length < 9) {
      fehler.push(`Zeile ${i + 1}: zu wenige Spalten (${felder.length}/9).`);
      continue;
    }
    const [datumStr, , buchungstext, betragStr, sollNr, , habenNr, , typStr] =
      felder;

    const datum = parseDatum(datumStr);
    const betrag = parseBetrag(betragStr);
    if (!datum) {
      fehler.push(`Zeile ${i + 1}: ungültiges Datum "${datumStr}".`);
      continue;
    }
    if (betrag === null || betrag <= 0) {
      fehler.push(`Zeile ${i + 1}: ungültiger Betrag "${betragStr}".`);
      continue;
    }

    const typ = typStr.trim();

    if (typ === 'Geldtransit') {
      const bankNr = zahlungsmittelFuerNummer('1200')?.nummer;
      const kasseNr = zahlungsmittelFuerNummer('1000')?.nummer;
      let richtung: 'bank_zu_kasse' | 'kasse_zu_bank' | null = null;
      if (sollNr === kasseNr && habenNr === bankNr) richtung = 'bank_zu_kasse';
      else if (sollNr === bankNr && habenNr === kasseNr)
        richtung = 'kasse_zu_bank';
      if (!richtung) {
        fehler.push(
          `Zeile ${i + 1}: Geldtransit-Konten nicht erkannt (Soll ${sollNr}, Haben ${habenNr}).`,
        );
        continue;
      }
      geldtransits.push({
        id: crypto.randomUUID(),
        datum,
        richtung,
        betrag,
        beschreibung: buchungstext
          .replace(/\s*\(Geldtransit \d+\)\s*$/, '')
          .trim(),
      });
      continue;
    }

    if (typ === 'Einnahme') {
      // Soll: Zahlungsmittel, Haben: Erlöskonto
      const zm = zahlungsmittelFuerNummer(sollNr);
      const konto = KONTEN.find(
        (k) => k.nummer === habenNr && k.typ === 'einnahme',
      );
      if (!zm || !konto) {
        fehler.push(
          `Zeile ${i + 1}: Konten nicht erkannt (Soll ${sollNr}, Haben ${habenNr}).`,
        );
        continue;
      }
      buchungen.push({
        id: crypto.randomUUID(),
        datum,
        typ: 'einnahme',
        betrag,
        zahlungsmittel: zm.id,
        konto: konto.id,
        beschreibung: buchungstext,
      });
      continue;
    }

    if (typ === 'Ausgabe') {
      // Soll: Aufwandskonto, Haben: Zahlungsmittel
      const konto = KONTEN.find(
        (k) => k.nummer === sollNr && k.typ === 'ausgabe',
      );
      const zm = zahlungsmittelFuerNummer(habenNr);
      if (!zm || !konto) {
        fehler.push(
          `Zeile ${i + 1}: Konten nicht erkannt (Soll ${sollNr}, Haben ${habenNr}).`,
        );
        continue;
      }
      buchungen.push({
        id: crypto.randomUUID(),
        datum,
        typ: 'ausgabe',
        betrag,
        zahlungsmittel: zm.id,
        konto: konto.id,
        beschreibung: buchungstext,
      });
      continue;
    }

    fehler.push(`Zeile ${i + 1}: unbekannter Typ "${typ}".`);
  }

  return { buchungen, geldtransits, fehler };
}
