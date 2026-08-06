"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function InvitationActions({ invitation, currentUser, currentUserEmail, onDone }: { invitation: any; currentUser: any; currentUserEmail?: string | null; onDone?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  function isSameEmail() {
    return (
      invitation.invited_email &&
      currentUserEmail &&
      invitation.invited_email.toLowerCase() === currentUserEmail.toLowerCase()
    );
  }

  async function revoke() {
    if (!confirm("Einladung wirklich zurückziehen?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("invitations").delete().eq("id", invitation.id);
      if (error) throw error;
      setDone(true);
      onDone?.();
      router.refresh();
    } catch (e: any) {
      alert("Löschen fehlgeschlagen: " + (e.message || e));
    } finally {
      setLoading(false);
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
    } catch (e: any) {
      alert("Aktion fehlgeschlagen: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function decline() {
    if (!confirm("Einladung ablehnen?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("invitations").delete().eq("id", invitation.id);
      if (error) throw error;
      setDone(true);
      onDone?.();
      router.refresh();
    } catch (e: any) {
      alert("Aktion fehlgeschlagen: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return null;
  }

  const isSender = invitation.created_by === currentUser;
  const isRecipient = invitation.invited_user_id === currentUser || isSameEmail();

  return (
    <div className="flex items-center gap-2">
      {loading && <LoadingOverlay />}
      {isSender && (
        <button onClick={revoke} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Zurückziehen</button>
      )}
      {isRecipient && (
        <>
          <button onClick={accept} className="rounded px-3 py-1 bg-green-600 text-white text-sm">Annehmen</button>
          <button onClick={decline} className="rounded px-3 py-1 bg-red-600 text-white text-sm">Ablehnen</button>
        </>
      )}
    </div>
  );
}
