"use client";

import { createCategory, deleteCategory, updateCategory } from "@/lib/drink-actions";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const result = await createCategory(newName);
    if (result.error) return setMessage(result.error);
    setNewName("");
    setMessage("Kategorie erstellt.");
    router.refresh();
  }

  async function saveCategory(id: number) {
    setMessage("");
    const result = await updateCategory(id, editingName);
    if (result.error) return setMessage(result.error);
    setEditingId(null);
    setMessage("Kategorie gespeichert.");
    router.refresh();
  }

  async function removeCategory(id: number, name: string) {
    if (!window.confirm(`Kategorie „${name}“ wirklich löschen?`)) return;
    setMessage("");
    const result = await deleteCategory(id);
    if (result.error) return setMessage(result.error);
    setMessage("Kategorie gelöscht.");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Eigene Kategorien</h2>
      <p className="mt-1 text-sm text-zinc-600">Diese Kategorien siehst und verwaltest nur du.</p>

      <form className="mt-4 flex gap-2" onSubmit={addCategory}>
        <input className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2" placeholder="Neue Kategorie" value={newName} onChange={(event) => setNewName(event.target.value)} />
        <button className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">Hinzufügen</button>
      </form>

      {categories.length > 0 ? (
        <ul className="mt-4 divide-y divide-zinc-100">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-2 py-3">
              {editingId === category.id ? (
                <input className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
              ) : (
                <span className="min-w-0 flex-1 font-medium">{category.name}</span>
              )}
              {editingId === category.id ? (
                <>
                  <button className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white" type="button" onClick={() => saveCategory(category.id)}>Speichern</button>
                  <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium" type="button" onClick={() => setEditingId(null)}>Abbrechen</button>
                </>
              ) : (
                <>
                  <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium" type="button" onClick={() => { setEditingId(category.id); setEditingName(category.name); }}>Bearbeiten</button>
                  <button className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700" type="button" onClick={() => removeCategory(category.id, category.name)}>Löschen</button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-zinc-600">Du hast noch keine eigenen Kategorien.</p>
      )}
      {message && <p className="mt-4 text-sm text-zinc-700" role="status">{message}</p>}
    </section>
  );
}
