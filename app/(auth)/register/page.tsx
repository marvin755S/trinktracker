"use client";

import { useState } from "react";
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
      <main>
      <h1>Registrieren</h1>

      <input
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="E-Mail"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Passwort"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={register} disabled={loading}>
        Registrieren
      </button>

      <p>{message}</p>
      </main>
    </>
  );
}
