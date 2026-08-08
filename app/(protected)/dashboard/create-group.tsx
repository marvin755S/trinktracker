"use client";

import { createGroup } from "@/lib/group-actions";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function CreateGroup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return;

    setError("");
    try {
      setLoading(true);

      await createGroup(name.trim());

      setName("");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Gruppe konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit();
  }


  return (
    <>
      {loading && <LoadingOverlay />}
      <div>

        <h2>Neue Gruppe</h2>

        <form className="mt-2 flex gap-2" onSubmit={handleSubmit}>
          <input
            className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Gruppenname"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white">
            Erstellen
          </button>
        </form>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      </div>
    </>
  );
}
