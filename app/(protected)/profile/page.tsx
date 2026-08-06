import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, approved, is_admin")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 pb-24 lg:py-12">
      <header>
        <p className="text-sm font-medium text-sky-600">Konto</p>
        <h1 className="text-3xl font-bold">Dein Profil</h1>
      </header>

      <dl className="mt-8 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white px-6 shadow-sm">
        <div className="py-4">
          <dt className="text-sm text-zinc-500">Name</dt>
          <dd className="mt-1 font-medium">{profile?.name || "Nicht angegeben"}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-zinc-500">E-Mail</dt>
          <dd className="mt-1 font-medium">{user.email || "Nicht verfügbar"}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm text-zinc-500">Status</dt>
          <dd className="mt-1 font-medium">{profile?.approved ? "Freigeschaltet" : "Wartet auf Freischaltung"}</dd>
        </div>
        {profile?.is_admin && (
          <div className="py-4">
            <dt className="text-sm text-zinc-500">Rolle</dt>
            <dd className="mt-1 font-medium">Administrator</dd>
          </div>
        )}
      </dl>
    </main>
  );
}
