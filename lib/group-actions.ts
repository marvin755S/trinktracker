"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createGroup(name: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht eingeloggt");
  }

  // Gruppe erstellen und ID zurückbekommen
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (groupError) {
    throw groupError;
  }

  // Ersteller als Owner hinzufügen
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    throw memberError;
  }

  revalidatePath("/dashboard");
}