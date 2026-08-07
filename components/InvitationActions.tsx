"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useToast } from "@/components/Toast";

export default function InvitationActions({ invitation, currentUser, currentUserEmail, onDone }: { invitation: any; currentUser: any; currentUserEmail?: string | null; onDone?: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [confirming, setConfirming] = useState<null | "revoke" | "decline">(null);

  const supabase = createClient();

  function isSameEmail() {
    return (
      invitation.invited_email &&
      currentUserEmail &&
      invitation.invited_email.toLowerCase() === currentUserEmail.toLowerCase()
    );
  }

  async function revoke() {
    setLoading(true);
    try {
      const { error } = await supabase.from("invitations").delete().eq("id", invitation.id);
      if (error) throw error;
      setDone(true);
      onDone?.();
      router.refresh();
      showToast("Einladung zurückgezogen", "success");
    } catch (e: any) {
      showToast("Löschen fehlgeschlagen: " + (e.message || e), "error");
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  }

  async function accept() {
    setLoading(true);
    try {
      // Add current user to group_members
      const { error: insertErr } = await supabase.from("group_members").insert([
        { group_id: invitation.group_id, user_id: currentUser, role: "member" },
      ]);
      if (insertErr) throw insertErr;

      // remove invitation
      const { error } = await supabase.from("invitations").delete().eq("id", invitation.id);
      if (error) throw error;

      setDone(true);
      onDone?.();
      router.refresh();
      showToast("Einladung angenommen", "success");
    } catch (e: any) {
      showToast("Aktion fehlgeschlagen: " + (e.message || e), "error");
    } finally {
      setLoading(false);
    }
  }

  async function decline() {
    setLoading(true);
    try {
      const { error } = await supabase.from("invitations").delete().eq("id", invitation.id);
      if (error) throw error;
      setDone(true);
      onDone?.();
      router.refresh();
      showToast("Einladung abgelehnt", "info");
    } catch (e: any) {
      showToast("Aktion fehlgeschlagen: " + (e.message || e), "error");
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  }

  if (done) {
    return null;
  }

  const isSender = invitation.created_by === currentUser;
  const isRecipient = invitation.invited_user_id === currentUser || isSameEmail();

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      {loading && <LoadingOverlay />}
      {isSender && confirming === "revoke" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={revoke} disabled={loading} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Rückziehen bestätigen</button>
          <button onClick={() => setConfirming(null)} disabled={loading} className="rounded px-3 py-1 border">Abbrechen</button>
        </div>
      )}
      {isSender && confirming !== "revoke" && (
        <button onClick={() => setConfirming("revoke")} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Zurückziehen</button>
      )}
      {isRecipient && (
        <>
          <button onClick={accept} className="rounded px-3 py-1 bg-green-600 text-white text-sm">Annehmen</button>
          {confirming === "decline" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={decline} disabled={loading} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Ablehnen bestätigen</button>
              <button onClick={() => setConfirming(null)} disabled={loading} className="rounded px-3 py-1 border">Abbrechen</button>
            </div>
          )}
          {confirming !== "decline" && (
            <button onClick={() => setConfirming("decline")} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Ablehnen</button>
          )}
        </>
      )}
    </div>
  );
}