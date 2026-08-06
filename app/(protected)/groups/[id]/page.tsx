import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";

type GroupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", id).single(),
    supabase.from("group_members").select("user_id, role").eq("group_id", id),
  ]);

  if (!group) {
    notFound();
  }

  const memberIds = members?.map((member) => member.user_id) ?? [];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, name").in("id", memberIds)
    : { data: [] };
  const namesById = new Map(profiles?.map((profile) => [profile.id, profile.name]));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-sky-700 hover:underline">
        ← Zurück zum Dashboard
      </Link>

      <header>
        <p className="text-sm font-medium text-sky-600">Gruppe</p>
        <h1 className="text-3xl font-bold">{group.name}</h1>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">Mitglieder</h2>
          <span className="text-sm text-zinc-500">{members?.length ?? 0} Personen</span>
        </div>

        <ul className="mt-4 divide-y divide-zinc-100">
          {members?.map((member) => (
            <li key={member.user_id} className="flex items-center justify-between py-3">
              <span>{namesById.get(member.user_id) || "Unbekanntes Mitglied"}</span>
              <span className="text-sm text-zinc-500">
                {member.role === "owner" ? "Owner" : "Mitglied"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 p-6">
        <h2 className="text-xl font-semibold">Events</h2>
        <p className="mt-2 text-zinc-600">
          Hier erscheinen später Events wie „Sommerurlaub 2026“. Getränke ohne
          Event bleiben trotzdem Teil dieser Gruppe und des Leaderboards.
        </p>
      </section>
    </main>
  );
}
