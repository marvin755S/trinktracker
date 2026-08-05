import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("id");

  return (
    <main>
      <h1>🍻 Trinktracker</h1>

      {error && (
        <p>Fehler: {error.message}</p>
      )}

      <h2>Kategorien</h2>

      <ul>
        {categories?.map((category) => (
          <li key={category.id}>
            {category.name}
          </li>
        ))}
      </ul>
    </main>
  );
}