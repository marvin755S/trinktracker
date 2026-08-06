import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
    ? await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, 60 * 60)
    : { data: null };


  // Aktuelle Gruppe laden
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  let groupName = null;

  if (pathname.startsWith("/groups/")) {
    const groupId = pathname.split("/")[2];

    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .single();

    groupName = group?.name ?? null;
  }


  return (
    <div className="min-h-screen bg-zinc-50 pt-5 lg:pt-0 pb-16 lg:pb-0 lg:pl-64">
      <Sidebar
        name={profile?.name || null}
        isAdmin={profile?.is_admin || false}
        avatarUrl={avatar?.signedUrl || null}
        groupName={groupName}
      />

      {children}
    </div>
  );
}