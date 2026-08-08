"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setMessage("");
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      // Keep the loading overlay visible while navigating to the dashboard.
      // The protected route's own loading.tsx will take over from here.
      await router.push("/dashboard");
    } catch (err) {
      console.error("login: unexpected error", err);
      setMessage((err as any)?.message ?? "Login fehlgeschlagen");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setMessage("Bitte fülle alle Felder aus.");
      return;
    }
    await login();
  }

  return (
    <>
      {loading && <LoadingOverlay />}
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Einloggen</h1>
          <p className="mt-2 text-sm text-zinc-600">Melde dich mit deinem Account an.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2"
              placeholder="E-Mail"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2"
              placeholder="Passwort"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between gap-4">
              <button type="submit" disabled={loading} className="rounded bg-sky-600 px-4 py-2 text-white">
                Einloggen
              </button>
              <Link href="/register" className="text-sm text-sky-600 hover:underline">Noch kein Konto? Registrieren</Link>
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
          </form>
        </div>
      </main>
    </>
  );
}