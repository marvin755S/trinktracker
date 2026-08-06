"use client";

import { createCategory, resolveCategoryDeletion, updateCategory } from "@/lib/drink-actions";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };

export default function CategoryManager({
  categories,
  replacementCategories,
}: {
  categories: Category[];
  replacementCategories: Category[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingDeleteWithDrinksId, setConfirmingDeleteWithDrinksId] = useState<number | null>(null);

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

  async function moveAndDelete(id: number) {
    setMessage("");
    const result = await resolveCategoryDeletion({
      id,
      mode: "move",
      targetCategoryId: Number(targetCategoryId),
    });
    if (result.error) return setMessage(result.error);
    setDeletingId(null);
    setTargetCategoryId("");
    setMessage("Getränke verschoben und Kategorie gelöscht.");
    router.refresh();
  }

  async function deleteWithDrinksConfirmed(id: number) {
    setMessage("");
    const result = await resolveCategoryDeletion({ id, mode: "delete_drinks" });
    if (result.error) return setMessage(result.error);
    setDeletingId(null);
    setConfirmingDeleteWithDrinksId(null);
    setMessage("Kategorie und zugehörige Getränke gelöscht.");
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
            <li key={category.id} className="py-3">
              <div className="flex items-center gap-2">
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
                    <button className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700" type="button" onClick={() => { setDeletingId(category.id); setTargetCategoryId(""); }}>Löschen</button>
                  </>
                )}
              </div>
              {deletingId === category.id && (
                <div className="mt-3 rounded-lg bg-zinc-100 p-3">
                  <p className="text-sm font-medium">Was soll mit den Getränken dieser Kategorie passieren?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select className="min-w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm" value={targetCategoryId} onChange={(event) => setTargetCategoryId(event.target.value)}>
                      <option value="">Zielkategorie wählen</option>
                      {replacementCategories.filter((item) => item.id !== category.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <button className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white" type="button" onClick={() => moveAndDelete(category.id)}>Verschieben & löschen</button>
                    {confirmingDeleteWithDrinksId === category.id ? (
                      <>
                        <button className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700" type="button" onClick={() => deleteWithDrinksConfirmed(category.id)}>Getränke löschen bestätigen</button>
                        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium" type="button" onClick={() => setConfirmingDeleteWithDrinksId(null)}>Abbrechen</button>
                      </>
                    ) : (
                      <button className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700" type="button" onClick={() => setConfirmingDeleteWithDrinksId(category.id)}>Getränke löschen</button>
                    )}
                    <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium" type="button" onClick={() => setDeletingId(null)}>Abbrechen</button>
                  </div>
                </div>
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
