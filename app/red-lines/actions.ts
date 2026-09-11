"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrSeedRedLines } from "@/lib/red-lines-store";
import type { ClauseType } from "@/lib/domain-types";

export type SaveRedLineResult = { ok: true } | { error: string };

// Saves one clause type's edited guidance and enabled state. Called once
// per row from the editing page below -- there's no need for a bulk save
// here since each row is its own form.
export async function saveRedLine(
  clauseType: ClauseType,
  guidance: string,
  enabled: boolean
): Promise<SaveRedLineResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "No account system is connected yet." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to edit your red lines." };
  }

  const trimmedGuidance = guidance.trim();
  if (!trimmedGuidance) {
    return { error: "Guidance can't be empty." };
  }

  // Make sure a row exists for every clause type before updating one --
  // covers a User who lands here before their red lines have been seeded
  // any other way.
  await getOrSeedRedLines(supabase, user.id);

  const { error } = await supabase
    .from("red_lines")
    .update({
      guidance: trimmedGuidance,
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("clause_type", clauseType);

  if (error) {
    return { error: "Couldn't save that change. Try again." };
  }

  revalidatePath("/red-lines");
  return { ok: true };
}
