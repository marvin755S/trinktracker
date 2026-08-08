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

  function validate() {
    if (!name.trim()) {
      setMessage("Bitte gib einen Namen ein.");
      return false;
    }
    if (!email.trim()) {
      setMessage("Bitte gib eine E-Mail-Adresse ein.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
      return false;
    }
    if (!password) {
      setMessage("Bitte gib ein Passwort ein.");
      return false;
    }
    if (password.length < 8) {
      setMessage("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return false;
    }
    return true;
  }

  async function register() {
    setMessage("");
    if (!validate()) return;
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
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
            name: name.trim(),
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await register();
  }

  return (
    <>
      {loading && <LoadingOverlay />}
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Registrieren</h1>
          <p className="mt-2 text-sm text-zinc-600">Erstelle ein neues Konto.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
                Name *
              </label>
              <input
                id="name"
                className="w-full rounded-md border border-zinc-200 px-3 py-2"
                placeholder="Dein Name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
                E-Mail *
              </label>
              <input
                id="email"
                className="w-full rounded-md border border-zinc-200 px-3 py-2"
                placeholder="E-Mail"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
                Passwort *
              </label>
              <input
                id="password"
                className="w-full rounded-md border border-zinc-200 px-3 py-2"
                placeholder="Passwort (mindestens 8 Zeichen)"
                type="password"
                value={password}
                required
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <button type="submit" disabled={loading} className="rounded bg-sky-600 px-4 py-2 text-white">Registrieren</button>
              <Link href="/login" className="text-sm text-sky-600 hover:underline">Bereits ein Konto? Einloggen</Link>
            </div>

            {message && <p className="text-sm text-red-600">{message}</p>}
          </form>
        </div>
      </main>
    </>
  );
}