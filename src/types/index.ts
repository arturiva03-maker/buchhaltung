// Zahlungsmittelkonten
export type ZahlungsmittelKonto = 'bank' | 'kasse';

// Buchungskonten nach SKR 03
export type BuchungsKonto =
  | 'erloese_kleinunternehmer'  // 8195 Erlöse als Kleinunternehmer i.S.d. § 19 Abs. 1 UStG
  | 'miete'                      // 4210 Miete
  | 'strom_gas'                  // 4240 Gas, Strom, Wasser
  | 'sonstiger_betriebsbedarf'   // 4980 Betriebsbedarf
  | 'ware'                       // 3200 Wareneingang
  | 'aufmerksamkeiten'           // 4653 Aufmerksamkeiten
  | 'betriebsausstattung'        // 0410 Geschäftsausstattung
  | 'gwg';                       // 0480 Geringwertige Wirtschaftsgüter

export type BuchungsTyp = 'einnahme' | 'ausgabe';

export interface Buchung {
  id: string;
  datum: string;
  typ: BuchungsTyp;
  betrag: number;
  zahlungsmittel: ZahlungsmittelKonto;
  konto: BuchungsKonto;
  beschreibung: string;
}

export interface Anfangsbestand {
  bank: number;
  kasse: number;
}

export type GeldtransitRichtung = 'bank_zu_kasse' | 'kasse_zu_bank';

export interface Geldtransit {
  id: string;
  datum: string;
  richtung: GeldtransitRichtung;
  betrag: number;
  beschreibung: string;
}

export interface Buchhaltung {
  id: string;
  name: string;
  buchungen: Buchung[];
  anfangsbestand: Anfangsbestand;
  geldtransits: Geldtransit[];
  erstelltAm: string;
}

export interface KontoInfo {
  id: BuchungsKonto;
  nummer: string;
  name: string;
  typ: 'einnahme' | 'ausgabe';
}

export const KONTEN: KontoInfo[] = [
  { id: 'erloese_kleinunternehmer', nummer: '8195', name: 'Erlöse als Kleinunternehmer', typ: 'einnahme' },
  { id: 'miete',                    nummer: '4210', name: 'Miete', typ: 'ausgabe' },
  { id: 'strom_gas',                nummer: '4240', name: 'Gas, Strom, Wasser', typ: 'ausgabe' },
  { id: 'sonstiger_betriebsbedarf', nummer: '4980', name: 'Betriebsbedarf', typ: 'ausgabe' },
  { id: 'ware',                     nummer: '3200', name: 'Wareneingang', typ: 'ausgabe' },
  { id: 'aufmerksamkeiten',         nummer: '4653', name: 'Aufmerksamkeiten', typ: 'ausgabe' },
  { id: 'betriebsausstattung',      nummer: '0410', name: 'Geschäftsausstattung', typ: 'ausgabe' },
  { id: 'gwg',                      nummer: '0480', name: 'Geringwertige Wirtschaftsgüter (GWG)', typ: 'ausgabe' },
];

export const ZAHLUNGSMITTEL: { id: ZahlungsmittelKonto; nummer: string; name: string }[] = [
  { id: 'bank',  nummer: '1200', name: 'Bank' },
  { id: 'kasse', nummer: '1000', name: 'Kasse' },
];

// SKR03 1360 — Geldtransit (Verrechnungskonto bei Übertragungen Bank ↔ Kasse)
export const GELDTRANSIT_KONTO = { nummer: '1360', name: 'Geldtransit' };
