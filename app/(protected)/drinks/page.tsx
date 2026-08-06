import DrinkForm from "@/app/(protected)/groups/[id]/drink-form";
import { createClient } from "@/lib/supabase-server";

export default async function DrinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: categories }, { data: eventMemberships }, { data: drinks }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("user_id", user!.id).order("name"),
    supabase.from("event_members").select("event_id").eq("user_id", user!.id),
    supabase
      .from("drinks")
      .select("id, amount, category_id, event_id, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const eventIds = eventMemberships?.map((membership) => membership.event_id) ?? [];
  const { data: events } = eventIds.length
    ? await supabase.from("events").select("id, name").in("id", eventIds).order("created_at")
    : { data: [] };
  const categoriesById = new Map(categories?.map((category) => [category.id, category.name]));
  const eventsById = new Map(events?.map((event) => [event.id, event.name]));

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
        {drinks && drinks.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-100">
            {drinks.map((drink) => (
              <li key={drink.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{categoriesById.get(drink.category_id) || "Kategorie"}</p>
                  <p className="text-sm text-zinc-500">
                    {drink.event_id ? eventsById.get(drink.event_id) || "Event" : "Kein Event"}
                  </p>
                </div>
                <strong>{drink.amount}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-zinc-600">Du hast noch keine Getränke hinzugefügt.</p>
        )}
      </section>
    </main>
  );
}
