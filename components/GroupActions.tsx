"use client";

import InviteMembers from "./InviteMembers";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function GroupActions({ groupId, isOwner }: { groupId: string; isOwner: boolean }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<null | "delete" | "leave">(null);

  async function deleteGroup() {
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
      setConfirming(null);
    }
  }

  async function leaveGroup() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/leave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: parseInt(groupId) }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("Verlassen fehlgeschlagen: " + (json?.error || res.statusText));
        return;
      }
      await router.push("/dashboard");
    } catch (e) {
      console.error("leaveGroup: unexpected error", e);
      alert("Verlassen fehlgeschlagen");
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  }

  return (
    <div className="space-y-4">
      {loading && <LoadingOverlay />}
      {!isOwner && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Gruppe verlassen</h3>
          <div className="mt-3">
            {confirming === "leave" ? (
              <div className="flex gap-2">
                <button onClick={() => leaveGroup()} disabled={loading} className={`rounded px-3 py-2 ${loading ? 'bg-red-300' : 'bg-red-600'} text-white`}>Verlassen bestätigen</button>
                <button onClick={() => setConfirming(null)} disabled={loading} className="rounded px-3 py-2 border border-zinc-300">Abbrechen</button>
              </div>
            ) : (
              <button onClick={() => setConfirming("leave")} disabled={loading} className={`rounded px-3 py-2 ${loading ? 'bg-red-300' : 'bg-red-600'} text-white`}>Gruppe verlassen</button>
            )}
          </div>
        </div>
      )}
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
            {confirming === "delete" ? (
              <div className="flex gap-2">
                <button onClick={() => deleteGroup()} disabled={loading} className={`rounded px-3 py-2 ${loading ? 'bg-red-300' : 'bg-red-600'} text-white`}>Löschen bestätigen</button>
                <button onClick={() => setConfirming(null)} disabled={loading} className="rounded px-3 py-2 border border-zinc-300">Abbrechen</button>
              </div>
            ) : (
              <button onClick={() => setConfirming("delete")} disabled={loading} className={`rounded px-3 py-2 ${loading ? 'bg-red-300' : 'bg-red-600'} text-white`}>Gruppe löschen</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
