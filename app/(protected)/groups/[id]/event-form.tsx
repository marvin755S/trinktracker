"use client";

import { createEvent } from "@/lib/drink-actions";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function EventForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const result = await createEvent(name, groupId);
    if (result.error) return setMessage(result.error);
    setName("");
    setMessage("Event erstellt.");
    router.refresh();
  }

  return (
    <form className="mt-4 flex gap-2" onSubmit={submit}>
      <input
        className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2"
        placeholder="Neues Event, z. B. Sommerurlaub 2026"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button className="rounded-md border border-zinc-300 px-4 py-2 font-medium" type="submit">
        Event anlegen
      </button>
      {message && <p className="self-center text-sm" role="status">{message}</p>}
    </form>
  );
}
