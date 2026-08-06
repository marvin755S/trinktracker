"use client";

import { useState } from "react";
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

      console.debug("login: calling signInWithPassword", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.debug("login: signInWithPassword result", { data, error });

      if (error) {
        setMessage(error.message);
        return;
      }

      console.debug("login: navigating to /dashboard");
      await router.push("/dashboard");
      console.debug("login: navigation complete");
    } catch (err) {
      console.error("login: unexpected error", err);
      setMessage((err as any)?.message ?? "Login fehlgeschlagen");
    } finally {
      setLoading(false);
      console.debug("login: loading=false");
    }
  }

  return (
    <>
      {loading && <LoadingOverlay />}
      <main>
      <h1>Login</h1>

      <input
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login} disabled={loading}>
        Einloggen
      </button>

      <p>{message}</p>
      </main>
    </>
  );
}