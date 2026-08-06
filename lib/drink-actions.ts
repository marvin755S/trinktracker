"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };

function validName(name: string) {
  const trimmedName = name.trim();
  return trimmedName.length > 0 && trimmedName.length <= 80 ? trimmedName : null;
}

export async function createCategory(name: string): Promise<ActionResult> {
  const categoryName = validName(name);
  if (!categoryName) return { error: "Bitte gib einen Kategorienamen ein." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du bist nicht eingeloggt." };

  const { error } = await supabase.from("categories").insert({
    name: categoryName,
    user_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/drinks");
  return {};
}

export async function addDrink({
  amount,
  categoryId,
  eventId,
}: {
  amount: number;
  categoryId: number;
  eventId: number | null;
}): Promise<ActionResult> {
  if (!Number.isInteger(amount) || amount < 1) {
    return { error: "Die Anzahl muss mindestens 1 sein." };
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return { error: "Bitte wähle eine Kategorie." };
  }

  if (eventId !== null && (!Number.isInteger(eventId) || eventId < 1)) {
    return { error: "Das ausgewählte Event ist ungültig." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du bist nicht eingeloggt." };

  const { error } = await supabase.from("drinks").insert({
    amount,
    category_id: categoryId,
    event_id: eventId,
    user_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/drinks");
  revalidatePath("/groups/[id]", "page");
  return {};
}

export async function createEvent(name: string, groupId: string): Promise<ActionResult> {
  const eventName = validName(name);
  if (!eventName) return { error: "Bitte gib einen Eventnamen ein." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du bist nicht eingeloggt." };

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({ group_id: Number(groupId), name: eventName })
    .select("id")
    .single();

  if (eventError) return { error: eventError.message };

  const { error: memberError } = await supabase
    .from("event_members")
    .insert({ event_id: event.id, user_id: user.id });

  if (memberError) return { error: memberError.message };

  revalidatePath(`/groups/${groupId}`);
  return {};
}
