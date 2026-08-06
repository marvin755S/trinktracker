import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import LeaderboardTable from "@/components/LeaderboardTable";

type EventPageProps = {
  params: Promise<{ id: string; eventId: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id, eventId } = await params;
  const supabase = await createClient();
  const [{ data: event }, { data: group }, { data: members }] = await Promise.all([
    supabase.from("events").select("id, name, group_id").eq("id", eventId).single(),
    supabase.from("groups").select("id, name").eq("id", id).single(),
    supabase.from("group_members").select("user_id, role").eq("group_id", id),
  ]);

  if (!event || !group || String(event.group_id) !== String(id)) {
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

  const { data: drinks } = memberIds.length
    ? await supabase.from("drinks").select("user_id, amount, category_id").eq("event_id", eventId)
    : { data: [] };

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
      const categoryId = drink.category_id ? String(drink.category_id) : "uncategorized";
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

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/groups/${id}`} className="text-sm font-medium text-sky-700 hover:underline">
            ← Zurück zur Gruppe
          </Link>
          <p className="mt-2 text-sm text-zinc-600">Event</p>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">Gruppe: {group.name}</p>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Event-Leaderboard</h2>
        <p className="mt-1 text-sm text-zinc-600">Drinks innerhalb dieses Events.</p>
        <LeaderboardTable columns={categoryColumns} rows={leaderboard} />
      </section>
    </main>
  );
}
