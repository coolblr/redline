// Round-trip smoke test (insert + read) for the four tables added in
// supabase/migrations/0002_analysis_schema.sql: flags, document_defects,
// counter_offers, qa_history.
//
// This cannot run in this environment (no live Supabase instance), so every
// test below skips itself honestly via it.skipIf(...) when the required env
// vars are absent, rather than faking a pass. Once a human provisions a
// Supabase project, sets the env vars below, and applies the migration,
// these start exercising a real database automatically.
//
// Auth mode: SERVICE ROLE KEY, not the anon key. Reasoning: 0002's RLS
// policies scope every row through `document_id in (select id from
// documents where user_id = auth.uid())`. A plain @supabase/supabase-js
// client using the anon key has no `auth.uid()` (no authenticated user
// session) unless this test also creates a real auth user and signs in,
// which is auth-flow machinery this schema smoke test doesn't need to
// exercise — that's ticket 01's concern, already covered elsewhere. The
// service role key bypasses RLS and lets this test verify the table
// shapes and foreign-key relationships directly, which is what "a
// round-trip smoke test passes for each new table" is asking for here.
// Uses SUPABASE_SERVICE_ROLE_KEY (a server-only secret, never the
// NEXT_PUBLIC_ prefixed anon key) alongside NEXT_PUBLIC_SUPABASE_URL.

import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
const skipReason =
  "NEXT_PUBLIC_SUPABASE_URL not set (and/or SUPABASE_SERVICE_ROLE_KEY not set) " +
  "-- skipping live-database smoke test. Provision a Supabase project, apply " +
  "supabase/migrations/0001_documents.sql and 0002_analysis_schema.sql, and " +
  "set both env vars to run this for real.";

describe.skipIf(!canRun)("analysis schema round-trip smoke test", () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let documentId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string);

    // documents.user_id references auth.users(id); create a throwaway auth
    // user via the admin API so the FK is satisfiable, then a throwaway
    // document owned by it for every table below to reference.
    const { data: userData, error: userError } = await supabase.auth.admin.createUser(
      {
        email: `redline-smoke-${Date.now()}@example.com`,
        email_confirm: true,
        password: crypto.randomUUID(),
      }
    );
    if (userError || !userData.user) {
      throw new Error(`Failed to create throwaway auth user: ${userError?.message}`);
    }
    testUserId = userData.user.id;

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: testUserId,
        filename: "smoke-test.txt",
        extracted_text: "This is a throwaway document for the analysis schema smoke test.",
      })
      .select("id")
      .single();
    if (docError || !doc) {
      throw new Error(`Failed to create throwaway document: ${docError?.message}`);
    }
    documentId = doc.id;
  });

  afterAll(async () => {
    if (documentId) {
      await supabase.from("documents").delete().eq("id", documentId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it("round-trips an insert + read on flags", async () => {
    const { data: inserted, error: insertError } = await supabase
      .from("flags")
      .insert({
        document_id: documentId,
        clause_type: "indemnification",
        severity_tier: "top",
        standard_or_unusual: "unusual",
        treatment_depth: "sharp",
        citation: "Contractor shall indemnify Client without limitation.",
        rationale: "Uncapped and one-sided indemnification.",
      })
      .select("*")
      .single();

    expect(insertError).toBeNull();
    expect(inserted).toBeTruthy();

    const { data: read, error: readError } = await supabase
      .from("flags")
      .select("*")
      .eq("id", inserted!.id)
      .single();

    expect(readError).toBeNull();
    expect(read?.clause_type).toBe("indemnification");
    expect(read?.severity_tier).toBe("top");
    expect(read?.document_id).toBe(documentId);

    await supabase.from("flags").delete().eq("id", inserted!.id);
  });

  it("round-trips an insert + read on document_defects", async () => {
    const { data: inserted, error: insertError } = await supabase
      .from("document_defects")
      .insert({
        document_id: documentId,
        defect_type: "dangling-reference",
        description: "References Schedule 1, which is not present in the text.",
        citation: "...set forth in Schedule 1, attached hereto...",
      })
      .select("*")
      .single();

    expect(insertError).toBeNull();
    expect(inserted).toBeTruthy();

    const { data: read, error: readError } = await supabase
      .from("document_defects")
      .select("*")
      .eq("id", inserted!.id)
      .single();

    expect(readError).toBeNull();
    expect(read?.defect_type).toBe("dangling-reference");
    expect(read?.document_id).toBe(documentId);

    await supabase.from("document_defects").delete().eq("id", inserted!.id);
  });

  it("round-trips an insert + read on counter_offers", async () => {
    // counter_offers.flag_id is not-null, so this needs a real flag first.
    const { data: flag, error: flagError } = await supabase
      .from("flags")
      .insert({
        document_id: documentId,
        clause_type: "ip-assignment",
        severity_tier: "top",
        standard_or_unusual: "unusual",
        treatment_depth: "sharp",
        citation: "All work product shall vest in Client upon creation.",
        rationale: "Ownership vests before payment.",
      })
      .select("id")
      .single();
    expect(flagError).toBeNull();
    expect(flag).toBeTruthy();

    const { data: inserted, error: insertError } = await supabase
      .from("counter_offers")
      .insert({
        flag_id: flag!.id,
        document_id: documentId,
        text: "Ownership should vest upon full payment, not upon creation.",
      })
      .select("*")
      .single();

    expect(insertError).toBeNull();
    expect(inserted).toBeTruthy();

    const { data: read, error: readError } = await supabase
      .from("counter_offers")
      .select("*")
      .eq("id", inserted!.id)
      .single();

    expect(readError).toBeNull();
    expect(read?.flag_id).toBe(flag!.id);
    expect(read?.document_id).toBe(documentId);

    await supabase.from("counter_offers").delete().eq("id", inserted!.id);
    await supabase.from("flags").delete().eq("id", flag!.id);
  });

  it("round-trips an insert + read on qa_history", async () => {
    const { data: inserted, error: insertError } = await supabase
      .from("qa_history")
      .insert({
        document_id: documentId,
        question: "Does this agreement include a non-compete clause?",
        answer: "This document doesn't address that question.",
        addressed_by_document: false,
      })
      .select("*")
      .single();

    expect(insertError).toBeNull();
    expect(inserted).toBeTruthy();

    const { data: read, error: readError } = await supabase
      .from("qa_history")
      .select("*")
      .eq("id", inserted!.id)
      .single();

    expect(readError).toBeNull();
    expect(read?.question).toBe("Does this agreement include a non-compete clause?");
    expect(read?.addressed_by_document).toBe(false);
    expect(read?.document_id).toBe(documentId);

    await supabase.from("qa_history").delete().eq("id", inserted!.id);
  });
});

if (!canRun) {
  // Vitest's describe.skipIf still registers a describe block, but log
  // the reason plainly too so `npm test` output makes it obvious why
  // these are skipped rather than absent.
  console.log(`[analysis-schema.smoke.test.ts] ${skipReason}`);
}
