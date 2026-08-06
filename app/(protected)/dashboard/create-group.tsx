"use client";

import { createGroup } from "@/lib/group-actions";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useState } from "react";


export default function CreateGroup() {
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name) return;

    try {
      setLoading(true);

      await createGroup(name);

      setName("");
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


      </div>
    </>
  );
}