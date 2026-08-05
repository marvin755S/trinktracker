import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.approved) {
    return (
      <main>
        <h1>Warte auf Freischaltung</h1>
        <p>
          Dein Account wurde erstellt, aber noch nicht freigegeben.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Willkommen, {profile.name}!</p>

      {profile.is_admin && (
        <p>Du bist Administrator.</p>
      )}
    </main>
  );
}
