"use client";

import InviteMembers from "./InviteMembers";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function GroupActions({ groupId, isOwner }: { groupId: string; isOwner: boolean }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function deleteGroup() {
    if (!confirm("Gruppe wirklich löschen? Diese Aktion ist endgültig.")) return;
    setLoading(true);
    try {
      console.debug("deleteGroup: calling server delete", { groupId });
      const res = await fetch("/api/groups/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: parseInt(groupId) }),
      });
      const json = await res.json();
      console.debug("deleteGroup: server response", json);
      if (!res.ok) {
        alert("Löschen fehlgeschlagen: " + (json?.error || res.statusText));
        return;
      }
      await router.push("/dashboard");
    } catch (e) {
      console.error("deleteGroup: unexpected error", e);
      alert("Löschen fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {loading && <LoadingOverlay />}
      {isOwner && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Mitglieder einladen</h3>
          <div className="mt-3">
            <InviteMembers groupId={groupId} />
          </div>
        </div>
      )}

      {isOwner && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Gruppe verwalten</h3>
            <div className="mt-3">
            <button onClick={deleteGroup} disabled={loading} className={`rounded px-3 py-2 ${loading ? 'bg-red-300' : 'bg-red-600'} text-white`}>Gruppe löschen</button>
          </div>
        </div>
      )}
    </div>
  );
}
