import type { OpenRouterClient } from "@/lib/openrouter";

// A plain, honest stub: complete(...) returns whatever `response` was
// constructed with, regardless of input. This is not a mock of
// analyzeDocument's own logic -- that still runs for real against
// whatever this returns.
export function createStubClient(response: unknown): OpenRouterClient {
  return {
    async complete() {
      return response;
    },
  };
}
