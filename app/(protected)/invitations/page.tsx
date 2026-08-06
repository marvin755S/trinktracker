import { createClient } from "@/lib/supabase-server";
import InvitationActions from "@/components/InvitationActions";

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
    const groupIds = Array.from(new Set([...(incoming ?? []).map((i) => i.group_id), ...(outgoing ?? []).map((i) => i.group_id)]));
    const groupsById = new Map();
    if (groupIds.length) {
      const { data: groups } = await supabase.from("groups").select("id, name").in("id", groupIds);
      groups?.forEach((g: any) => groupsById.set(g.id, g.name));
    }

    // Lade Profilnamen für created_by und invited_user_id
    const userIds = Array.from(new Set([...(incoming ?? []).map((i) => i.created_by).filter(Boolean), ...(outgoing ?? []).map((i) => i.created_by).filter(Boolean), ...(incoming ?? []).map((i) => i.invited_user_id).filter(Boolean), ...(outgoing ?? []).map((i) => i.invited_user_id).filter(Boolean)]));
    const profilesById = new Map();
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds);
      profiles?.forEach((p: any) => profilesById.set(p.id, p.name));
    }

    // Attach names
    incoming = incoming.map((inv) => ({
      ...inv,
      group_name: groupsById.get(inv.group_id) || String(inv.group_id),
      inviter_name: profilesById.get(inv.created_by) || null,
      invited_name: inv.invited_user_id ? profilesById.get(inv.invited_user_id) || null : null,
    }));
    outgoing = outgoing.map((inv) => ({
      ...inv,
      group_name: groupsById.get(inv.group_id) || String(inv.group_id),
      inviter_name: profilesById.get(inv.created_by) || null,
      invited_name: inv.invited_user_id ? profilesById.get(inv.invited_user_id) || null : null,
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
            <li key={inv.id} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium">Von: {inv.inviter_name || inv.created_by}</div>
                <div className="text-xs text-zinc-500">Gruppe: {inv.group_name} • Status: {inv.status}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-zinc-500">{new Date(inv.created_at).toLocaleString()}</div>
                {/* @ts-ignore Server -> Client */}
                <InvitationActions invitation={inv} currentUser={user.id} currentUserEmail={user.email} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Deine Einladungen</h2>
        {invitationsError ? (
          <div className="mt-2 text-sm text-red-600">
            Die Tabelle "invitations" existiert nicht oder ein Fehler ist aufgetreten.
            <div className="mt-2 text-sm text-zinc-700">
              Empfohlenes SQL zum Erstellen der Tabelle (gruppe_id ist bigint in deinem Schema):
              <pre className="mt-2 rounded bg-zinc-100 p-2 text-xs">
CREATE TABLE public.invitations (
  id uuid primary key default gen_random_uuid(),
  group_id bigint not null references public.groups(id) on delete cascade,
  invited_email text,
  invited_user_id uuid,
  status text default 'pending',
  created_by uuid,
  created_at timestamptz default now()
);
              </pre>
            </div>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {outgoing.length === 0 && <li className="text-sm text-zinc-500">Keine gesendeten Einladungen</li>}
            {outgoing.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">{inv.invited_name || inv.invited_email || "(kein Empfänger)"}</div>
                  <div className="text-xs text-zinc-500">Gruppe: {inv.group_name} • Status: {inv.status}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-zinc-500">{new Date(inv.created_at).toLocaleString()}</div>
                  {/* @ts-ignore Server -> Client */}
                  <InvitationActions invitation={inv} currentUser={user.id} currentUserEmail={user.email} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
