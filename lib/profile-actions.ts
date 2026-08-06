"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };

export async function updateProfileName(name: string): Promise<ActionResult> {
  const trimmedName = name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 80) {
    return { error: "Der Name muss zwischen 1 und 80 Zeichen lang sein." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_profile_name", { profile_name: trimmedName });
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}

export async function updateAvatarPath(path: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (path !== null && path !== `${user.id}/avatar`)) return { error: "Ungültiger Bildpfad." };

  const { error } = await supabase.rpc("update_own_avatar_path", { new_avatar_path: path });
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}
