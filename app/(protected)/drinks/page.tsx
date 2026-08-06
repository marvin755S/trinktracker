import DrinkForm from "@/app/(protected)/groups/[id]/drink-form";
import { createClient } from "@/lib/supabase-server";

export default async function DrinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: categories }, { data: groupMemberships }, { data: drinks }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .or(`user_id.eq.${user!.id},user_id.is.null`)
      .order("name"),
    supabase.from("group_members").select("group_id").eq("user_id", user!.id),
    supabase
      .from("drinks")
      .select("id, amount, category_id, event_id, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const groupIds = groupMemberships?.map((m) => m.group_id) ?? [];
  const { data: events } = groupIds.length
    ? await supabase.from("events").select("id, name").in("group_id", groupIds).order("created_at")
    : { data: [] };
  const categoriesById = new Map(categories?.map((category) => [String(category.id), category.name]));
  const eventsById = new Map(events?.map((event) => [String(event.id), event.name]));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-10 pb-24 lg:py-12">
      <header>
        <p className="text-sm font-medium text-sky-600">Persönlich</p>
        <h1 className="text-3xl font-bold">Deine Getränke</h1>
        <p className="mt-2 text-zinc-600">
          Sie zählen in allen Gruppen, in denen du Mitglied bist.
        </p>
      </header>

      <DrinkForm categories={categories ?? []} events={events ?? []} />

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Zuletzt hinzugefügt</h2>
        {/* Client-side list for immediate delete updates */}
        {/* Attach category and event names to each drink for the client */}
        {
          /* Preprocess drinks to include resolved names */
        }
        <DrinkHistoryList
          initial={
            (drinks ?? []).map((d) => ({
              ...d,
              _categoryName: categoriesById.get(String(d.category_id)) ?? null,
              _eventName: d.event_id ? eventsById.get(String(d.event_id)) ?? null : null,
            }))
          }
        />
      </section>
    </main>
  );
}

import DrinkHistoryList from '@/components/DrinkHistoryList';
