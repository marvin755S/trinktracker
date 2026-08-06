"use client";

import InviteMembers from "./InviteMembers";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GroupActions({ groupId, isOwner }: { groupId: string; isOwner: boolean }) {
  const router = useRouter();

  async function deleteGroup() {
    if (!confirm("Gruppe wirklich löschen? Diese Aktion ist endgültig.")) return;
    try {
      const supabase = createClient();
      await supabase.from("groups").delete().eq("id", parseInt(groupId));
      router.push("/dashboard");
    } catch (e) {
      alert("Löschen fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-4">
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
            <button onClick={deleteGroup} className="rounded bg-red-600 px-3 py-2 text-white">Gruppe löschen</button>
          </div>
        </div>
      )}
    </div>
  );
}
