"use client";
/* eslint-disable @next/next/no-img-element */

import { updateAvatarPath, updateProfileName } from "@/lib/profile-actions";
import { createClient } from "@/lib/supabase";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileSettings({ initialName, email, userId, avatarUrl }: { initialName: string; email: string; userId: string; avatarUrl: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [newEmail, setNewEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const result = await updateProfileName(name);
    if (result.error) return setMessage(result.error);
    setMessage("Name gespeichert.");
    router.refresh();
  }

  async function verifyCurrentPassword() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (error) {
      setMessage("Das aktuelle Passwort ist nicht korrekt.");
      return null;
    }
    return supabase;
  }

  async function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = await verifyCurrentPassword();
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) return setMessage(error.message);
    setCurrentPassword("");
    setMessage("Bestätige die E-Mail-Änderung über die Nachricht in deinem Postfach.");
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (newPassword.length < 8) return setMessage("Das neue Passwort muss mindestens 8 Zeichen haben.");
    const supabase = await verifyCurrentPassword();
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return setMessage(error.message);
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Passwort geändert.");
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("avatar") as File | null;
    if (!file || file.size === 0) return setMessage("Bitte wähle ein Bild aus.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      return setMessage("Erlaubt sind JPG, PNG oder WebP bis maximal 2 MB.");
    }

    setMessage("");
    const path = `${userId}/avatar`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) return setMessage(uploadError.message);

    const result = await updateAvatarPath(path);
    if (result.error) return setMessage(result.error);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("Profilbild gespeichert.");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Profilbild</h2>
        <div className="mt-4 flex items-center gap-4">
          {avatarPreview ? <img className="h-20 w-20 rounded-full object-cover" src={avatarPreview} alt="Dein Profilbild" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">{initialName.slice(0, 1).toUpperCase()}</div>}
          <form className="flex-1" onSubmit={uploadAvatar}>
            <input className="block w-full text-sm" name="avatar" accept="image/jpeg,image/png,image/webp" type="file" />
            <button className="mt-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium" type="submit">Bild hochladen</button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Name</h2>
        <form className="mt-4 flex gap-2" onSubmit={saveName}>
          <input className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">Speichern</button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">E-Mail ändern</h2>
        <form className="mt-4 grid gap-3" onSubmit={saveEmail}>
          <input className="rounded-md border border-zinc-300 px-3 py-2" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Aktuelles Passwort" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <button className="w-fit rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">E-Mail-Änderung anfordern</button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Passwort ändern</h2>
        <form className="mt-4 grid gap-3" onSubmit={savePassword}>
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Aktuelles Passwort" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <input className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Neues Passwort (mindestens 8 Zeichen)" type="password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          <button className="w-fit rounded-md bg-sky-600 px-4 py-2 font-medium text-white" type="submit">Passwort ändern</button>
        </form>
      </section>

      {message && <p className="text-sm text-zinc-700" role="status">{message}</p>}
    </div>
  );
}
