"use client";

import { useState } from "react";

export default function DrinkHistoryItem({ drink, categoryName, eventName, onDeleted }: any) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drinks/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: drink.id }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onDeleted(drink.id);
      } else {
        setError(data.error || 'Löschen fehlgeschlagen');
      }
    } catch (e) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-medium">{categoryName || 'Kategorie'}</p>
        <p className="text-sm text-zinc-500">{eventName || (drink.event_id ? 'Event' : 'Kein Event')}</p>
        <p className="mt-1 text-xs text-zinc-400">{new Date(drink.created_at).toLocaleString()}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <strong>{drink.amount}</strong>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50">Löschen</button>
        ) : (
          <div className="flex items-center gap-2">
            <button disabled={loading} onClick={handleDelete} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Löschen bestätigen</button>
            <button disabled={loading} onClick={() => setConfirming(false)} className="rounded px-3 py-1 border">Abbrechen</button>
          </div>
        )}
      </div>
    </li>
  );
}
