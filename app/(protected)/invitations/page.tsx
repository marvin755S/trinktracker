import { createClient } from "@/lib/supabase-server";
import InvitationItem from "@/components/InvitationItem";

// InviteForm moved to group actions; this page shows incoming and outgoing invitations

export default async function InvitationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // (no group list needed on this page)

  // Lade eingehende Einladungen für den aktuellen Nutzer (per email oder user id)
  let incoming: any[] = [];
  let outgoing: any[] = [];
  let invitationsError = null;
  try {
    const email = user.email;
    const { data: incomingData } = email
      ? await supabase.from("invitations").select("id, group_id, invited_email, invited_user_id, status, created_at, created_by").or(`invited_email.eq.${email},invited_user_id.eq.${user.id}`)
      : await supabase.from("invitations").select("id, group_id, invited_email, invited_user_id, status, created_at, created_by").eq("invited_user_id", user.id);
    incoming = incomingData ?? [];

    // Lade von diesem Nutzer erstellte Einladungen (gesendete Einladungen)
    const { data: outgoingData } = await supabase.from("invitations").select("id, group_id, invited_email, invited_user_id, status, created_at, created_by").eq("created_by", user.id);
    outgoing = outgoingData ?? [];

    // Lade zugehörige Gruppennamen
    const groupIds = Array.from(new Set([...(incoming ?? []).map((i) => String(i.group_id)), ...(outgoing ?? []).map((i) => String(i.group_id))]));
    const groupsById = new Map<string, string>();
    if (groupIds.length) {
      const { data: groups } = await supabase.from("groups").select("id, name").in("id", groupIds);
      groups?.forEach((g: any) => groupsById.set(String(g.id), g.name));
    }

    // Lade Profilnamen für created_by und invited_user_id
    const userIds = Array.from(
      new Set([
        ...(incoming ?? []).map((i) => i.created_by).filter(Boolean),
        ...(outgoing ?? []).map((i) => i.created_by).filter(Boolean),
        ...(incoming ?? []).map((i) => i.invited_user_id).filter(Boolean),
        ...(outgoing ?? []).map((i) => i.invited_user_id).filter(Boolean),
      ]),
    );
    const profilesById = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds.map(String));
      profiles?.forEach((p: any) => profilesById.set(String(p.id), p.name));
    }

    // Attach names
    incoming = incoming.map((inv) => ({
      ...inv,
      group_name: groupsById.get(String(inv.group_id)) || String(inv.group_id),
      inviter_name: inv.created_by ? profilesById.get(String(inv.created_by)) || null : null,
      invited_name: inv.invited_user_id ? profilesById.get(String(inv.invited_user_id)) || null : null,
    }));
    outgoing = outgoing.map((inv) => ({
      ...inv,
      group_name: groupsById.get(String(inv.group_id)) || String(inv.group_id),
      inviter_name: inv.created_by ? profilesById.get(String(inv.created_by)) || null : null,
      invited_name: inv.invited_user_id ? profilesById.get(String(inv.invited_user_id)) || null : null,
    }));
  } catch (e: any) {
    invitationsError = e;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Einladungen</h1>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Eingehende Einladungen</h2>
        <p className="mt-2 text-sm text-zinc-600">Hier siehst du Einladungen, die andere für dich erstellt haben.</p>
        <ul className="mt-3 space-y-2">
          {invitationsError && <li className="text-sm text-red-600">Fehler beim Laden der Einladungen.</li>}
          {!invitationsError && incoming.length === 0 && <li className="text-sm text-zinc-500">Keine eingehenden Einladungen</li>}
          {incoming.map((inv) => (
            <InvitationItem
              key={inv.id}
              invitation={inv}
              currentUser={user.id}
              currentUserEmail={user.email}
              type="incoming"
            />
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Deine Einladungen</h2>
        {invitationsError ? (
          <p className="mt-2 text-sm text-red-600">Fehler beim Laden der Einladungen.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {outgoing.length === 0 && <li className="text-sm text-zinc-500">Keine gesendeten Einladungen</li>}
            {outgoing.map((inv) => (
              <InvitationItem
                key={inv.id}
                invitation={inv}
                currentUser={user.id}
                currentUserEmail={user.email}
                type="outgoing"
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
