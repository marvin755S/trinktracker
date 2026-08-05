"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function register() {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
            approved: false,
        });

        if (profileError) {
        setMessage(profileError.message);
        return;
        }
    }

    setMessage("Account erstellt. Warte auf Freischaltung.");
  }

  return (
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

      <button onClick={register}>
        Registrieren
      </button>

      <p>{message}</p>
    </main>
  );
}