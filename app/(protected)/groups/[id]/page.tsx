import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventForm from "./event-form";
import GroupActions from "@/components/GroupActions";
import LeaderboardTable from "@/components/LeaderboardTable";
/* eslint-disable @next/next/no-img-element */

type GroupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", id).single(),
    supabase.from("group_members").select("user_id, role").eq("group_id", id),
  ]);

  if (!group) {
    notFound();
  }

  const memberIds = members?.map((member) => member.user_id) ?? [];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, name, avatar_path").in("id", memberIds)
    : { data: [] };
  const namesById = new Map(profiles?.map((profile) => [profile.id, profile.name]));
  const avatarEntries = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      if (!profile.avatar_path) return [profile.id, null] as const;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60);
      return [profile.id, data?.signedUrl || null] as const;
    })
  );
  const avatarsById = new Map(avatarEntries);

  const [{ data: groupEvents }, { data: drinks }] = await Promise.all([
    supabase.from("events").select("id, name").eq("group_id", id).order("created_at"),
    memberIds.length
      ? supabase.from("drinks").select("user_id, amount, category_id").in("user_id", memberIds)
      : Promise.resolve({ data: [] }),
  ]);

  const uncategorizedExists = (drinks ?? []).some((drink) => !drink.category_id);
  const categoryIds = Array.from(new Set((drinks ?? []).map((drink) => drink.category_id).filter(Boolean)));
  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] };

  if (uncategorizedExists) {
    categoryIds.push("uncategorized");
  }

  const categoryMap = new Map(categories?.map((category) => [String(category.id), category.name]));
  const leaderboard = (members ?? []).map((member) => {
    const counts: Record<string, number> = {};
    let total = 0;
    (drinks ?? []).forEach((drink) => {
      if (drink.user_id !== member.user_id) return;
      const categoryId = String(drink.category_id ?? "uncategorized");
      counts[categoryId] = (counts[categoryId] ?? 0) + drink.amount;
      total += drink.amount;
    });
    return {
      id: member.user_id,
      name: namesById.get(member.user_id) || "Unbekanntes Mitglied",
      avatarUrl: avatarsById.get(member.user_id) || null,
      counts,
      total,
    };
  });

  const categoryColumns = categoryIds.map((categoryId) => ({
    id: String(categoryId),
    name: categoryMap.get(String(categoryId)) || "Unkategorisiert",
  }));
  const currentMembership = members?.find((member) => member.user_id === user?.id);

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
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <p className="mt-1 text-sm text-zinc-600">Alle Getränke der Gruppenmitglieder.</p>
        <LeaderboardTable columns={categoryColumns} rows={leaderboard} />
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 p-6">
        <h2 className="text-xl font-semibold">Events</h2>
        {groupEvents && groupEvents.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {groupEvents.map((event) => (
              <li key={event.id}>
                <Link href={`/groups/${id}/events/${event.id}`} className="text-sky-600 hover:underline">
                  {event.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-zinc-600">
            Noch keine Events. Als Owner kannst du hier eines anlegen.
          </p>
        )}
        {currentMembership?.role === "owner" && <EventForm groupId={id} />}
      </section>

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

      {/* Group actions: invite members, delete group (owner only) */}
      {/* @ts-ignore Server -> Client */}
      <div>
        <GroupActions groupId={String(id)} isOwner={currentMembership?.role === "owner"} />
      </div>
    </main>
  );
}
