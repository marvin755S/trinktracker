import { createClient } from "@/lib/supabase-server";
// InviteForm moved to group actions; this page shows incoming invitations

export default async function InvitationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // (no group list needed on this page)

  // Lade eingehende Einladungen für den aktuellen Nutzer (per email oder user id)
  let invitations: any[] = [];
  let invitationsError = null;
  try {
    const email = user.email;
    const { data } = email
      ? await supabase.from("invitations").select("id, group_id, invited_email, status, created_at, created_by").or(`invited_email.eq.${email},invited_user_id.eq.${user.id}`)
      : await supabase.from("invitations").select("id, group_id, invited_email, status, created_at, created_by").eq("invited_user_id", user.id);
    invitations = data ?? [];
  } catch (e: any) {
    invitationsError = e;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">Einladungen</h1>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Eingehende Einladungen</h2>
        <p className="mt-2 text-sm text-zinc-600">Hier siehst du Einladungen, die andere für dich erstellt haben.</p>
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
            {invitations.length === 0 && <li className="text-sm text-zinc-500">Keine Einladungen</li>}
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">{inv.invited_email}</div>
                  <div className="text-xs text-zinc-500">Gruppe: {inv.group_id} • Status: {inv.status}</div>
                </div>
                <div className="text-sm text-zinc-500">{new Date(inv.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
