// Zahlungsmittelkonten
export type ZahlungsmittelKonto = 'bank' | 'kasse';

// Buchungskonten nach SKR 4
export type BuchungsKonto =
  | 'erloese_kleinunternehmer'  // Erlöse als Kleinunternehmer
  | 'miete'                      // Miete
  | 'strom_gas'                  // Strom/Gas
  | 'sonstiger_betriebsbedarf'   // Sonstiger Betriebsbedarf
  | 'ware'                       // Ware
  | 'aufmerksamkeiten'           // Aufmerksamkeiten
  | 'betriebsausstattung'        // Betriebsausstattung
  | 'gwg';                       // Geringwertige Wirtschaftsgüter

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

export interface KontoInfo {
  id: BuchungsKonto;
  name: string;
  typ: 'einnahme' | 'ausgabe';
}

export const KONTEN: KontoInfo[] = [
  { id: 'erloese_kleinunternehmer', name: 'Erlöse als Kleinunternehmer', typ: 'einnahme' },
  { id: 'miete', name: 'Miete', typ: 'ausgabe' },
  { id: 'strom_gas', name: 'Strom/Gas', typ: 'ausgabe' },
  { id: 'sonstiger_betriebsbedarf', name: 'Sonstiger Betriebsbedarf', typ: 'ausgabe' },
  { id: 'ware', name: 'Ware', typ: 'ausgabe' },
  { id: 'aufmerksamkeiten', name: 'Aufmerksamkeiten', typ: 'ausgabe' },
  { id: 'betriebsausstattung', name: 'Betriebsausstattung', typ: 'ausgabe' },
  { id: 'gwg', name: 'Geringwertige Wirtschaftsgüter (GWG)', typ: 'ausgabe' },
];

export const ZAHLUNGSMITTEL: { id: ZahlungsmittelKonto; name: string }[] = [
  { id: 'bank', name: 'Bank' },
  { id: 'kasse', name: 'Kasse' },
];
