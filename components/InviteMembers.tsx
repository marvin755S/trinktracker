"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type ProfileResult = { id: string; name: string; email?: string };

export default function InviteMembers({ groupId }: { groupId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  // Debounced search when typing
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!query) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        // search by name only — profiles table does not reliably include email
        const q = `%${query}%`;
        const { data } = await supabase.from("profiles").select("id, name").ilike("name", q).limit(10);
        setResults((data ?? []) as ProfileResult[]);
      } catch (e) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  function toggleSelectProfile(p: ProfileResult) {
    setSelectedUsers((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      if (exists) return prev.filter((x) => x.id !== p.id);
      return [...prev, p];
    });
  }


  async function sendInvites() {
    if (selectedUsers.length === 0) return;
    setLoading(true);
    try {
      const supabase = supabaseRef.current;
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp?.user?.id ?? null;
      const inserts: any[] = [];
      for (const u of selectedUsers) inserts.push({ group_id: parseInt(groupId), invited_user_id: u.id, invited_email: '', created_by: userId });
      if (inserts.length > 0) {
        const { error } = await supabase.from("invitations").insert(inserts);
        if (error) throw error;
      }
      setSelectedUsers([]);
      router.refresh();
      alert("Einladungen gesendet");
    } catch (e: any) {
      const msg = e?.message ?? (e?.error ?? "Senden fehlgeschlagen");
      alert(`Senden fehlgeschlagen: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-zinc-700">Mitglieder suchen</label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-zinc-400">🔍</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name" className="w-full rounded-full border px-4 py-2 shadow-sm" />
        </div>
        <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
          {results.map((r) => (
            <li key={r.id} onClick={() => toggleSelectProfile(r)} className="flex cursor-pointer items-center justify-between hover:bg-zinc-50 px-2 py-2 rounded">
              <div>
                <div className="text-sm">{r.name}</div>
                {r.email && <div className="text-xs text-zinc-500">{r.email}</div>}
              </div>
              <div className={`text-sm ${selectedUsers.find((s) => s.id === r.id) ? "text-sky-600" : "text-zinc-600"}`}>
                {selectedUsers.find((s) => s.id === r.id) ? "Ausgewählt" : "Wählen"}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="block text-sm text-zinc-700">Ausgewählt</label>
        <ul className="mt-2 space-y-1">
          {selectedUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm">{u.name}</div>
              </div>
              <button type="button" onClick={() => setSelectedUsers((prev) => prev.filter((x) => x.id !== u.id))} className="text-sm text-red-500">Entfernen</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Email input removed: invites are created by invited_user_id only */}

      <div className="flex items-center gap-2">
        <button onClick={sendInvites} disabled={loading} className="rounded bg-sky-600 px-3 py-2 text-white">
          {loading ? "Sende..." : "Einladen"}
        </button>
      </div>
    </div>
  );
}
