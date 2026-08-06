"use client";

import { useEffect, useState } from "react";
import DrinkHistoryItem from "./DrinkHistoryItem";

export default function DrinkHistoryList({ initial }: { initial: any[] }) {
  const [items, setItems] = useState(initial ?? []);

  useEffect(() => {
    setItems(initial ?? []);
  }, [initial]);

  function handleDeleted(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (!items || items.length === 0) return <p className="mt-3 text-zinc-600">Du hast noch keine Getränke hinzugefügt.</p>;

  return (
    <ul className="mt-4 divide-y divide-zinc-100">
      {items.map((drink) => (
        <DrinkHistoryItem
          key={drink.id}
          drink={drink}
          categoryName={drink._categoryName}
          eventName={drink._eventName}
          onDeleted={handleDeleted}
        />
      ))}
    </ul>
  );
}
