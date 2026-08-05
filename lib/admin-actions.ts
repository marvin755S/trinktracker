
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
  console.log("APPROVE USER AUFGERUFEN:", userId);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht eingeloggt");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Keine Adminrechte");
  }

    const { data, error } = await supabase
    .from("profiles")
    .update({
        approved: true,
    })
    .eq("id", userId)
    .select();

    console.log("UPDATE RESULT:", data);
    console.log("UPDATE ERROR:", error);
  if (error) {
    throw error;
  }

  revalidatePath("/admin");
}