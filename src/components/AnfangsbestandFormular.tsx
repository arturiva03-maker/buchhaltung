'use client';

import { useState, useEffect } from 'react';
import { Anfangsbestand } from '@/types';

interface AnfangsbestandFormularProps {
  anfangsbestand: Anfangsbestand;
  onAnfangsbestandAendern: (anfangsbestand: Anfangsbestand) => void;
}

export default function AnfangsbestandFormular({
  anfangsbestand,
  onAnfangsbestandAendern,
}: AnfangsbestandFormularProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bank, setBank] = useState(anfangsbestand.bank);
  const [kasse, setKasse] = useState(anfangsbestand.kasse);

  useEffect(() => {
    setBank(anfangsbestand.bank);
    setKasse(anfangsbestand.kasse);
  }, [anfangsbestand]);

  const handleSave = () => {
    onAnfangsbestandAendern({ bank, kasse });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBank(anfangsbestand.bank);
    setKasse(anfangsbestand.kasse);
    setIsEditing(false);
  };

  const formatBetrag = (betrag: number) => {
    return betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Anfangsbestand</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-700 transition-colors text-sm"
          >
            Bearbeiten
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="anfangsbestand-bank" className="block text-sm font-medium text-gray-700 mb-1">
              Bank
            </label>
            <input
              id="anfangsbestand-bank"
              type="number"
              value={bank}
              onChange={(e) => setBank(parseFloat(e.target.value) || 0)}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="anfangsbestand-kasse" className="block text-sm font-medium text-gray-700 mb-1">
              Kasse
            </label>
            <input
              id="anfangsbestand-kasse"
              type="number"
              value={kasse}
              onChange={(e) => setKasse(parseFloat(e.target.value) || 0)}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Speichern
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Bank</p>
            <p className="text-lg font-bold text-gray-800">{formatBetrag(bank)}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Kasse</p>
            <p className="text-lg font-bold text-gray-800">{formatBetrag(kasse)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
