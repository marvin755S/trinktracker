"use client";

import { useState } from "react";
import InvitationActions from "@/components/InvitationActions";

type InvitationItemProps = {
  invitation: any;
  currentUser: string;
  currentUserEmail?: string | null;
  type: "incoming" | "outgoing";
};

export default function InvitationItem({ invitation, currentUser, currentUserEmail, type }: InvitationItemProps) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const title =
    type === "incoming"
      ? `Von: ${invitation.inviter_name || invitation.invited_email || "Unbekannt"}`
      : invitation.invited_name || invitation.invited_email || "(kein Empfänger)";

  const subtitle = `Gruppe: ${invitation.group_name || "Unbekannte Gruppe"} • Status: ${invitation.status}`;

  return (
    <li className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-zinc-500">{subtitle}</div>
        <div className="mt-1 text-xs text-zinc-500 sm:hidden">
          {new Date(invitation.created_at).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden text-sm text-zinc-500 sm:block">
          {new Date(invitation.created_at).toLocaleString()}
        </div>
        <InvitationActions
          invitation={invitation}
          currentUser={currentUser}
          currentUserEmail={currentUserEmail}
          onDone={() => setHidden(true)}
        />
      </div>
    </li>
  );
}