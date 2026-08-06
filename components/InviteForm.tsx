"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function InviteForm({ groups }: { groups: Array<{ id: string; name: string }> }) {
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState(groups?.[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !groupId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp?.user?.id ?? null;
      const { error } = await supabase.from("invitations").insert([{ group_id: groupId, invited_email: email, created_by: userId }]);
      if (error) throw error;
      setEmail("");
      router.refresh();
      setMessage('Einladung gesendet.');
    } catch (err) {
      setMessage('Einladung fehlgeschlagen. Stelle sicher, dass die Tabelle "invitations" in Supabase existiert.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={sendInvite} className="space-y-3">
      <div>
        <label className="block text-sm text-zinc-700">An Gruppe</label>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="mt-1 w-full rounded border px-2 py-1">
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-700">E-Mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
      </div>

      <button type="submit" disabled={loading} className="rounded bg-sky-600 px-3 py-2 text-white">
        {loading ? "Sende..." : "Einladung senden"}
      </button>
      {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
    </form>
  );
}
