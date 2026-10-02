// Turns whatever runAnalysis threw into a message a reader can act on.
// lib/openrouter.ts throws errors that carry the provider's raw response
// body, and a malformed model reply throws a validation error full of field
// names. Neither belongs on screen.

export const ANALYSIS_BUSY_MESSAGE =
  "The analysis service is busy right now. Wait a few seconds and try again.";

export const ANALYSIS_FAILED_MESSAGE = "The analysis didn't finish. Try again in a moment.";

// Messages the app writes itself in app/documents/[id]/actions.ts
// ("Sign in to run analysis.", "Couldn't find that document.", "Couldn't save
// the flagged clauses. Try again."). Already plain language, so passed on.
const APP_MESSAGE = /^(Sign in|Couldn't)/;

export type AnalysisActionState = { error: string | null };

export function friendlyAnalysisError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";

  if (/status 429\b/.test(message)) return ANALYSIS_BUSY_MESSAGE;
  if (APP_MESSAGE.test(message)) return message;
  return ANALYSIS_FAILED_MESSAGE;
}
