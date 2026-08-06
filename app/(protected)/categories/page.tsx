import CategoryManager from "./category-manager";
import { createClient } from "@/lib/supabase-server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, user_id")
    .or(`user_id.eq.${user!.id},user_id.is.null`)
    .order("name");

  const defaultCategories = categories?.filter((category) => category.user_id === null) ?? [];
  const personalCategories = categories?.filter((category) => category.user_id === user!.id) ?? [];

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10 pb-24 lg:py-12">
      <header>
        <p className="text-sm font-medium text-sky-600">Getränke</p>
        <h1 className="text-3xl font-bold">Kategorien</h1>
        <p className="mt-2 text-zinc-600">Standardkategorien sind für alle gleich. Eigene Kategorien kannst du selbst verwalten.</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Standardkategorien</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {defaultCategories.map((category) => <li key={category.id} className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium">{category.name}</li>)}
        </ul>
      </section>

      <CategoryManager categories={personalCategories} />
    </main>
  );
}
