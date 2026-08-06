import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen bg-zinc-50 pb-16 lg:pb-0 lg:pl-64">
      <Sidebar name={profile.name} isAdmin={profile.is_admin} />
      {children}
    </div>
  );
}
