"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeDocument } from "@/lib/seams/analyze-document";
import { DEFAULT_RED_LINES } from "@/lib/red-lines";
import type { Flag } from "@/lib/domain-types";

// Server Action bound to a specific document id from the page (a Server
// Component), per Next.js's pattern for passing extra arguments into a
// form action. Runs analyzeDocument for real and persists its output --
// documents.summary (update) and one row per flag into flags (insert).
//
// This is the only place analysis is triggered: the document page renders
// straight from what's already persisted whenever a summary exists, and
// only calls this action from an explicit "Run analysis" submit. That's
// deliberate -- ticket 10 (saved library) needs "no re-analysis when
// opening a saved document" to hold, and this is the code path that would
// violate it if analysis ran on every page load instead of on request.
export async function runAnalysis(documentId: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("No account system is connected yet.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sign in to run analysis.");
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, extracted_text")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    throw new Error("Couldn't find that document.");
  }

  const { summary, flags } = await analyzeDocument(
    (document.extracted_text as string) ?? "",
    DEFAULT_RED_LINES
  );

  const { error: summaryError } = await supabase
    .from("documents")
    .update({ summary })
    .eq("id", documentId);

  if (summaryError) {
    throw new Error("Couldn't save the analysis summary. Try again.");
  }

  if (flags.length > 0) {
    const { error: flagsError } = await supabase.from("flags").insert(
      flags.map((flag: Flag) => ({
        document_id: documentId,
        clause_type: flag.clauseType,
        severity_tier: flag.severityTier,
        standard_or_unusual: flag.standardOrUnusual,
        treatment_depth: flag.treatmentDepth,
        citation: flag.citation,
        rationale: flag.rationale,
      }))
    );

    if (flagsError) {
      throw new Error("Couldn't save the flagged clauses. Try again.");
    }
  }

  revalidatePath(`/documents/${documentId}`);
}
