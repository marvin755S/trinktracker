import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

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
    <>
      {children}
    </>
  );
}