"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function MemberList({
  members,
  namesById,
  groupId,
  currentUserId,
  isOwner,
}: {
  members: { user_id: string; role: string }[];
  namesById: Record<string, string> | Map<string, string>;
  groupId: string;
  currentUserId: string | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const nameFor = (id: string) => (namesById instanceof Map ? namesById.get(id) : (namesById as any)[id]) || "Unbekanntes Mitglied";

  async function removeMemberConfirmed(userId: string) {
    setLoadingId(userId);
    try {
      const res = await fetch("/api/groups/remove-member", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: Number(groupId), userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("Entfernen fehlgeschlagen: " + (json?.error || res.statusText), "error");
        return;
      }
      showToast("Mitglied entfernt", "success");
      router.refresh();
    } catch (e) {
      console.error(e);
      showToast("Entfernen fehlgeschlagen", "error");
    } finally {
      setLoadingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <ul className="mt-4 divide-y divide-zinc-100">
      {members.map((member) => (
        <li key={member.user_id} className="flex items-center justify-between py-3">
          <span>{nameFor(member.user_id)}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">{member.role === "owner" ? "Owner" : "Mitglied"}</span>
            {isOwner && member.user_id !== currentUserId && confirmingId === member.user_id && (
              <div className="flex gap-2">
                <button disabled={loadingId === member.user_id} onClick={() => removeMemberConfirmed(member.user_id)} className="rounded px-2 py-1 text-sm bg-red-600 text-white">Entfernen bestätigen</button>
                <button disabled={loadingId === member.user_id} onClick={() => setConfirmingId(null)} className="rounded px-2 py-1 border">Abbrechen</button>
              </div>
            )}
            {isOwner && member.user_id !== currentUserId && confirmingId !== member.user_id && (
              <button disabled={loadingId === member.user_id} onClick={() => setConfirmingId(member.user_id)} className="rounded px-2 py-1 text-sm bg-red-600 text-white">Mitglied entfernen</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
