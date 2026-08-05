import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { approveUser } from "@/lib/admin-actions";

export default async function AdminPage() {
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

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("approved", false);

  return (
    <main>
      <h1>Admin Bereich</h1>

      <h2>Wartende Benutzer</h2>

      {users?.length === 0 && (
        <p>Keine offenen Anfragen.</p>
      )}

      {users?.map((user) => (
        <div key={user.id}>
          <p>
            {user.name} - {user.email}
          </p>

          <form action={approveUser.bind(null, user.id)}>
            <button>
                Freigeben
            </button>
          </form>
        </div>
      ))}
    </main>
  );
}