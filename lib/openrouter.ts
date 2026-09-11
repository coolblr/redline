// The only place in this codebase that constructs a request to OpenRouter.
// Every seam (analyzeDocument, draftCounterOffer, answerQuestion) calls
// openRouterClient.complete(...) rather than talking to OpenRouter directly.
// CLAUDE.md: "Model calls go through OpenRouter, never a direct provider SDK."

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterClient {
  complete(params: {
    messages: OpenRouterMessage[];
    jsonSchema: { name: string; schema: Record<string, unknown> };
  }): Promise<unknown>;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function complete(params: {
  messages: OpenRouterMessage[];
  jsonSchema: { name: string; schema: Record<string, unknown> };
}): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }
  if (!model) {
    throw new Error("OPENROUTER_MODEL is not set.");
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        provider: { order: ["fireworks"], allow_fallbacks: false },
        require_parameters: true,
        reasoning: { effort: "low" },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: params.jsonSchema.name,
            strict: true,
            schema: params.jsonSchema.schema,
          },
        },
      }),
    });
  } catch (err) {
    throw new Error(
      `OpenRouter request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter request failed with status ${response.status}: ${body}`
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(
      `OpenRouter response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const content = (
    data as {
      choices?: Array<{ message?: { content?: string } }>;
    }
  )?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error(
      "OpenRouter response did not contain a message content string."
    );
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(
      `OpenRouter message content was not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export const openRouterClient: OpenRouterClient = { complete };
