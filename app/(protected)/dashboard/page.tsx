import { createClient } from "@/lib/supabase-server";
import CreateGroup from "./create-group";
import Link from "next/link";

type GroupMembership = {
  role: "owner" | "member";
  groups: {
    id: string;
    name: string;
  };
};

export default async function Dashboard() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();


  const { data: groupMemberships } = await supabase
    .from("group_members")
    .select(`
      role,
      groups!inner (
        id,
        name
      )
    `)
    .eq("user_id", user!.id);
  const groups = groupMemberships as unknown as GroupMembership[] | null;
  const uniqueMemberships = groups ? Array.from(new Map(groups.map((g) => [g.groups.id, g])).values()) : [];


  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-sky-600">Drink Tracker</p>
        <h1 className="text-3xl font-bold">Deine Gruppen</h1>
        <p className="mt-2 text-zinc-600">
          Deine Getränke zählen in allen Gruppen, in denen du Mitglied bist.
          Events sind optional.
        </p>
      </header>

      <section aria-labelledby="groups-heading">
        <h2 id="groups-heading" className="sr-only">Gruppenübersicht</h2>

        {groups && groups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {uniqueMemberships.map((item) => (
              <Link
                key={item.groups.id}
                href={`/groups/${item.groups.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-sky-400 hover:shadow-md"
              >
                <p className="text-lg font-semibold">{item.groups.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Rolle: {item.role === "owner" ? "Owner" : "Mitglied"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-zinc-600">
            Du bist noch in keiner Gruppe. Erstelle deine erste Gruppe.
          </p>
        )}
      </section>

      <section className="rounded-xl bg-zinc-50 p-6">
        <CreateGroup />
      </section>
    </main>
  );
}
