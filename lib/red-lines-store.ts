// Server-side data access for a User's persisted red lines
// (supabase/migrations/0004_red_lines.sql). Importable from both the
// red-lines editing page (app/red-lines/) and app/documents/[id]/actions.ts,
// which is the only reason this lives in its own file instead of inline in
// either caller.
//
// Seeding is lazy: the first time a signed-in User's red lines are read and
// no rows exist yet for them, this inserts one row per DEFAULT_RED_LINES
// entry and returns that seeded set. There is no Supabase trigger doing
// this on user creation -- simpler, and there's no live database available
// here to test a trigger against anyway.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClauseType } from "@/lib/domain-types";
import { DEFAULT_RED_LINES, type RedLine } from "@/lib/red-lines";

type RedLineRow = {
  clause_type: ClauseType;
  guidance: string;
  enabled: boolean;
};

function rowToRedLine(row: RedLineRow): RedLine {
  return {
    clauseType: row.clause_type,
    guidance: row.guidance,
    enabled: row.enabled,
  };
}

export async function getOrSeedRedLines(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string
): Promise<RedLine[]> {
  const { data: existingRows, error: selectError } = await supabase
    .from("red_lines")
    .select("clause_type, guidance, enabled")
    .eq("user_id", userId);

  if (selectError) {
    throw new Error("Couldn't load your red lines. Try again.");
  }

  if (existingRows && existingRows.length > 0) {
    return (existingRows as RedLineRow[]).map(rowToRedLine);
  }

  // No rows yet for this User -- seed from the default set. Uses upsert
  // with the (user_id, clause_type) unique constraint so a concurrent
  // first access from the same User doesn't produce duplicate rows or a
  // failed insert; either request lands on the same seeded content.
  const { error: seedError } = await supabase.from("red_lines").upsert(
    DEFAULT_RED_LINES.map((redLine) => ({
      user_id: userId,
      clause_type: redLine.clauseType,
      guidance: redLine.guidance,
      enabled: redLine.enabled,
    })),
    { onConflict: "user_id,clause_type", ignoreDuplicates: true }
  );

  if (seedError) {
    throw new Error("Couldn't set up your red lines. Try again.");
  }

  return DEFAULT_RED_LINES;
}
