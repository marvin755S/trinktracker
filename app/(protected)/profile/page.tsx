import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ProfileSettings from "./profile-settings";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, is_admin, avatar_path")
    .eq("id", user.id)
    .single();

  const { data: avatar } = profile?.avatar_path
    ? await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60)
    : { data: null };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 pb-24 lg:py-12">
      <header>
        <p className="text-sm font-medium text-sky-600">Konto</p>
        <h1 className="text-3xl font-bold">Dein Profil</h1>
      </header>

      <dl className="mt-8 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white px-6 shadow-sm">
        <div className="py-4">
          <dt className="text-sm text-zinc-500">E-Mail</dt>
          <dd className="mt-1 font-medium">{user.email || "Nicht verfügbar"}</dd>
        </div>
        {profile?.is_admin && (
          <div className="py-4">
            <dt className="text-sm text-zinc-500">Rolle</dt>
            <dd className="mt-1 font-medium">Administrator</dd>
          </div>
        )}
      </dl>

      <ProfileSettings
        initialName={profile?.name || ""}
        email={user.email || ""}
        userId={user.id}
        avatarUrl={avatar?.signedUrl || null}
      />
    </main>
  );
}
