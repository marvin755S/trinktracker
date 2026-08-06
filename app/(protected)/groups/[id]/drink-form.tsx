"use client";

import { addDrink, createCategory } from "@/lib/drink-actions";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Category = { id: number; name: string };
type Event = { id: number; name: string };

export default function DrinkForm({
  categories,
  events,
}: {
  categories: Category[];
  events: Event[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [eventId, setEventId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitDrink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const result = await addDrink({
      amount: Number(amount),
      categoryId: Number(categoryId),
      eventId: eventId ? Number(eventId) : null,
    });

    setIsSaving(false);
    if (result.error) return setMessage(result.error);

    setAmount("1");
    setEventId("");
    setMessage("Getränk hinzugefügt.");
    router.refresh();
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const result = await createCategory(newCategory);
    if (result.error) return setMessage(result.error);
    setNewCategory("");
    setMessage("Kategorie erstellt.");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Getränk hinzufügen</h2>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitDrink}>
        <label className="grid gap-1 text-sm font-medium">
          Anzahl
          <input className="rounded-md border border-zinc-300 px-3 py-2" min="1" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Kategorie
          <select className="rounded-md border border-zinc-300 px-3 py-2" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Auswählen</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">
          Event (optional)
          <select className="rounded-md border border-zinc-300 px-3 py-2" value={eventId} onChange={(event) => setEventId(event.target.value)}>
            <option value="">Kein Event</option>
            {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <button className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-50 sm:col-span-2" disabled={isSaving || categories.length === 0} type="submit">
          {isSaving ? "Wird gespeichert …" : "Getränk speichern"}
        </button>
      </form>

      {categories.length === 0 && <p className="mt-3 text-sm text-amber-700">Erstelle zuerst eine Kategorie.</p>}
      {message && <p className="mt-3 text-sm text-zinc-700" role="status">{message}</p>}

      <form className="mt-6 flex gap-2" onSubmit={submitCategory}>
        <input className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2" placeholder="Neue Kategorie, z. B. Bier" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
        <button className="rounded-md border border-zinc-300 px-4 py-2 font-medium" type="submit">Kategorie anlegen</button>
      </form>
    </section>
  );
}
