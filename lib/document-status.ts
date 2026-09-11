// Status label for a saved document row in the library listing (ticket 10).
// A document's analysis state is fully determined by whether
// documents.summary has been written yet -- runAnalysis (see
// app/documents/[id]/actions.ts) sets it in one update once analysis
// completes, and it's null until then. This function only reads that one
// field, so the library page and the document page can agree on the same
// label without either one re-deriving it.
export function documentStatusLabel(summary: string | null): string {
  return summary === null ? "Not analyzed yet" : "Analyzed";
}
