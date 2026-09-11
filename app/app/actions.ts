"use server";

import { createClient } from "@/lib/supabase/server";

// This is the only thing that crosses the client/server boundary for a
// document upload: a filename string and the already-extracted text
// string. A File/Blob/ArrayBuffer cannot be passed to a Server Action in
// this shape — parsing happens entirely in the browser before this runs,
// and the original file bytes never leave it (CLAUDE.md invariant).
export type SaveDocumentInput = {
  filename: string;
  text: string;
};

export type SaveDocumentResult = { id: string } | { error: string };

export async function saveDocument(
  input: SaveDocumentInput
): Promise<SaveDocumentResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "No account system is connected yet." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to save a document." };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      filename: input.filename.trim() || null,
      extracted_text: input.text,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't save this document. Try again." };
  }

  return { id: data.id as string };
}
