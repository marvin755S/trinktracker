"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    setMessage("");
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const user = data.user;

      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name,
            approved: true,
          });

        if (profileError) {
          setMessage(profileError.message);
          return;
        }
      }

      setMessage("Account erstellt. Bitte bestätige jetzt deine E-Mail-Adresse über den Link in deinem Postfach.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <LoadingOverlay />}
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Registrieren</h1>
          <p className="mt-2 text-sm text-zinc-600">Erstelle ein neues Konto.</p>

          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2"
              placeholder="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between gap-4">
              <button onClick={register} disabled={loading} className="rounded bg-sky-600 px-4 py-2 text-white">Registrieren</button>
              <Link href="/login" className="text-sm text-sky-600 hover:underline">Bereits ein Konto? Einloggen</Link>
            </div>

            {message && <p className="text-sm text-zinc-700">{message}</p>}
          </div>
        </div>
      </main>
    </>
  );
}
