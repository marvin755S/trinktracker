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
  revalidatePath("/categories");
  return {};
}

export async function updateCategory(id: number, name: string): Promise<ActionResult> {
  const categoryName = validName(name);
  if (!Number.isInteger(id) || id < 1 || !categoryName) {
    return { error: "Bitte gib einen gültigen Kategorienamen ein." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du bist nicht eingeloggt." };

  const { error } = await supabase
    .from("categories")
    .update({ name: categoryName })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/categories");
  revalidatePath("/drinks");
  return {};
}

export async function resolveCategoryDeletion({
  id,
  mode,
  targetCategoryId,
}: {
  id: number;
  mode: "move" | "delete_drinks";
  targetCategoryId?: number;
}): Promise<ActionResult> {
  if (!Number.isInteger(id) || id < 1) return { error: "Ungültige Kategorie." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du bist nicht eingeloggt." };

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (categoryError) return { error: categoryError.message };
  if (!category) return { error: "Diese Kategorie darf nicht gelöscht werden." };

  if (mode === "move") {
    const targetId = targetCategoryId;
    if (typeof targetId !== "number" || !Number.isInteger(targetId) || targetId < 1 || targetId === id) {
      return { error: "Bitte wähle eine andere Zielkategorie." };
    }

    const { data: targetCategory, error: targetError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", targetId)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .maybeSingle();

    if (targetError) return { error: targetError.message };
    if (!targetCategory) return { error: "Die Zielkategorie ist nicht verfügbar." };

    const { error: moveError } = await supabase
      .from("drinks")
      .update({ category_id: targetId })
      .eq("user_id", user.id)
      .eq("category_id", id);

    if (moveError) return { error: moveError.message };
  } else if (mode === "delete_drinks") {
    const { error: drinksError } = await supabase
      .from("drinks")
      .delete()
      .eq("user_id", user.id)
      .eq("category_id", id);

    if (drinksError) return { error: drinksError.message };
  } else {
    return { error: "Ungültige Löschoption." };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/categories");
  revalidatePath("/drinks");
  revalidatePath("/groups/[id]", "page");
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
