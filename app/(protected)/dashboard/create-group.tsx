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


  return (
    <>
      {loading && <LoadingOverlay />}
      <div>

        <h2>Neue Gruppe</h2>


        <input
          placeholder="Gruppenname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />


        <button onClick={submit}>
          Erstellen
        </button>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      </div>
    </>
  );
}
