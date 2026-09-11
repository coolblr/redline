"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeDocument } from "@/lib/seams/analyze-document";
import { draftCounterOffer } from "@/lib/seams/draft-counter-offer";
import { filterFlagsByRedLines } from "@/lib/red-lines";
import { getOrSeedRedLines } from "@/lib/red-lines-store";
import type { DocumentDefect, Flag } from "@/lib/domain-types";

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

  const userRedLines = await getOrSeedRedLines(supabase, user.id);

  const { summary, flags: allFlags, documentDefects } = await analyzeDocument(
    (document.extracted_text as string) ?? "",
    userRedLines
  );

  // analyzeDocument always tries to extract every checkable clause type;
  // which of those the User actually wants to see is decided here, after
  // the fact, based on which clause types they've enabled (lib/red-lines.ts).
  const flags = filterFlagsByRedLines(allFlags, userRedLines);

  const { error: summaryError } = await supabase
    .from("documents")
    .update({ summary })
    .eq("id", documentId);

  if (summaryError) {
    throw new Error("Couldn't save the analysis summary. Try again.");
  }

  if (flags.length > 0) {
    // .select() pulls back the inserted rows' real database ids -- needed
    // below to draft one counter_offers row per surviving, persisted flag
    // with the correct flag_id. Without this, insert() alone returns no
    // rows, and there'd be no id to attach a counter-offer to.
    const { data: insertedFlags, error: flagsError } = await supabase
      .from("flags")
      .insert(
        flags.map((flag: Flag) => ({
          document_id: documentId,
          clause_type: flag.clauseType,
          severity_tier: flag.severityTier,
          standard_or_unusual: flag.standardOrUnusual,
          treatment_depth: flag.treatmentDepth,
          citation: flag.citation,
          rationale: flag.rationale,
        }))
      )
      .select("id, clause_type, severity_tier, standard_or_unusual, treatment_depth, citation, rationale");

    if (flagsError) {
      throw new Error("Couldn't save the flagged clauses. Try again.");
    }

    // One draftCounterOffer call per surviving, persisted flag -- the
    // red-lines filter above has already run, so a flag the User disabled
    // never gets a counter-offer drafted for it. This is an accepted cost
    // of the feature (spec.md, PRD.md user story 14): runAnalysis now makes
    // 1 + N OpenRouter calls, not something to work around by making
    // counter-offer drafting lazy or on-demand.
    //
    // A single flag's draft failing doesn't take down the whole action --
    // the User should still get their summary/flags/defects even if one
    // counter-offer draft errors. Caught per-flag, logged, and skipped.
    const persistedFlags = (insertedFlags as
      | Array<{
          id: string;
          clause_type: Flag["clauseType"];
          severity_tier: Flag["severityTier"];
          standard_or_unusual: Flag["standardOrUnusual"];
          treatment_depth: Flag["treatmentDepth"];
          citation: string;
          rationale: string;
        }>
      | null) ?? [];

    const extractedText = (document.extracted_text as string) ?? "";

    for (const persistedFlag of persistedFlags) {
      const flagForDraft: Flag = {
        clauseType: persistedFlag.clause_type,
        severityTier: persistedFlag.severity_tier,
        standardOrUnusual: persistedFlag.standard_or_unusual,
        treatmentDepth: persistedFlag.treatment_depth,
        citation: persistedFlag.citation,
        rationale: persistedFlag.rationale,
      };

      let counterOffer;
      try {
        counterOffer = await draftCounterOffer(extractedText, flagForDraft);
      } catch (err) {
        console.warn("runAnalysis: draftCounterOffer failed for flag; continuing without it.", {
          flagId: persistedFlag.id,
          err,
        });
        continue;
      }

      const { error: counterOfferError } = await supabase.from("counter_offers").insert({
        flag_id: persistedFlag.id,
        document_id: documentId,
        text: counterOffer.text,
      });

      if (counterOfferError) {
        console.warn("runAnalysis: failed to save a drafted counter-offer; continuing.", {
          flagId: persistedFlag.id,
          error: counterOfferError,
        });
      }
    }
  }

  if (documentDefects.length > 0) {
    const { error: defectsError } = await supabase.from("document_defects").insert(
      documentDefects.map((defect: DocumentDefect) => ({
        document_id: documentId,
        defect_type: defect.defectType,
        description: defect.description,
        citation: defect.citation,
      }))
    );

    if (defectsError) {
      throw new Error("Couldn't save the document defects. Try again.");
    }
  }

  revalidatePath(`/documents/${documentId}`);
}
