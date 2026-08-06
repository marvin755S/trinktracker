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
      const supabase = createClient();
      console.debug("deleteGroup: deleting group", { groupId });
      const { data, error } = await supabase.from("groups").delete().eq("id", parseInt(groupId));
      console.debug("deleteGroup: result", { data, error });
      if (error) {
        alert("Löschen fehlgeschlagen: " + error.message);
        return;
      }

      // Erfolg -> zurück zum Dashboard
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
