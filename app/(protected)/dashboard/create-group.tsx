"use client";

import { createGroup } from "@/lib/group-actions";
import { useState } from "react";


export default function CreateGroup() {

  const [name, setName] = useState("");


  async function submit() {

    if (!name) return;

    await createGroup(name);

    setName("");

  }


  return (
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
  );
}