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
    .select("name, is_admin, avatar_path")
    .eq("id", user.id)
    .single();

  const { data: avatar } = profile?.avatar_path
    ? await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60)
    : { data: null };

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 lg:pb-0 lg:pl-64">
      <Sidebar name={profile?.name || null} isAdmin={profile?.is_admin || false} avatarUrl={avatar?.signedUrl || null} />
      {children}
    </div>
  );
}
