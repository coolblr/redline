import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openRouterClient } from "@/lib/openrouter";

const ORIGINAL_ENV = { ...process.env };

function mockFetchOnce(response: {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: response.json ?? (async () => ({})),
    text: response.text ?? (async () => ""),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("openRouterClient.complete", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "test-model/id";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("sends the expected request shape and env-derived model", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ message: "hi" }) } }],
      }),
    });

    await openRouterClient.complete({
      messages: [{ role: "user", content: "hello" }],
      jsonSchema: {
        name: "greeting",
        schema: {
          type: "object",
          properties: { message: { type: "string" } },
          required: ["message"],
          additionalProperties: false,
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-key");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("test-model/id");
    expect(body.messages).toEqual([{ role: "user", content: "hello" }]);
    expect(body.provider).toEqual({ order: ["fireworks"], allow_fallbacks: false });
    expect(body.require_parameters).toBe(true);
    expect(body.reasoning).toEqual({ effort: "low" });
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: {
        name: "greeting",
        strict: true,
        schema: {
          type: "object",
          properties: { message: { type: "string" } },
          required: ["message"],
          additionalProperties: false,
        },
      },
    });
  });

  it("parses a valid mock response into the returned object", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: JSON.stringify({ message: "hello there" }) } },
        ],
      }),
    });

    const result = await openRouterClient.complete({
      messages: [{ role: "user", content: "hi" }],
      jsonSchema: { name: "greeting", schema: {} },
    });

    expect(result).toEqual({ message: "hello there" });
  });

  it("throws a clear error on an HTTP failure", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      text: async () => "internal error",
    });

    await expect(
      openRouterClient.complete({
        messages: [{ role: "user", content: "hi" }],
        jsonSchema: { name: "greeting", schema: {} },
      })
    ).rejects.toThrow(/500/);
  });

  it("throws a clear error when the message content is not valid JSON", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not json" } }],
      }),
    });

    await expect(
      openRouterClient.complete({
        messages: [{ role: "user", content: "hi" }],
        jsonSchema: { name: "greeting", schema: {} },
      })
    ).rejects.toThrow();
  });

  it("throws when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;

    await expect(
      openRouterClient.complete({
        messages: [{ role: "user", content: "hi" }],
        jsonSchema: { name: "greeting", schema: {} },
      })
    ).rejects.toThrow(/OPENROUTER_API_KEY/);
  });

  it("throws when OPENROUTER_MODEL is missing", async () => {
    delete process.env.OPENROUTER_MODEL;

    await expect(
      openRouterClient.complete({
        messages: [{ role: "user", content: "hi" }],
        jsonSchema: { name: "greeting", schema: {} },
      })
    ).rejects.toThrow(/OPENROUTER_MODEL/);
  });
});
