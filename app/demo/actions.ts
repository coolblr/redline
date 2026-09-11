"use server";

import { createClient } from "@/lib/supabase/server";
import { openRouterClient } from "@/lib/openrouter";

const GREETING_SCHEMA = {
  name: "greeting",
  schema: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    required: ["message"],
    additionalProperties: false,
  },
} as const;

export async function runOpenRouterDemo(): Promise<
  { message: string } | { error: string }
> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "No account system is connected yet." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to try this." };
  }

  try {
    const result = (await openRouterClient.complete({
      messages: [
        {
          role: "user",
          content:
            "Reply with a short, plain-English one-sentence greeting confirming you received this test message.",
        },
      ],
      jsonSchema: GREETING_SCHEMA,
    })) as { message: string };

    if (typeof result?.message !== "string") {
      return { error: "OpenRouter returned a response with no message." };
    }

    return { message: result.message };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "The request failed.",
    };
  }
}
