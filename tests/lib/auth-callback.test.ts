import { beforeEach, describe, expect, it, vi } from "vitest";

// The route talks to Supabase through lib/supabase/server. Replace that one
// seam with a stub so the route's own logic runs for real.
const exchangeCodeForSession = vi.fn();
const createClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

import { GET } from "@/app/auth/callback/route";

function callback(search: string) {
  return GET(new Request(`https://redline.example/auth/callback${search}`));
}

describe("GET /auth/callback (email confirmation link)", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    createClient.mockReset();
    createClient.mockResolvedValue({ auth: { exchangeCodeForSession } });
  });

  it("exchanges the code for a session and sends the reader to the upload page", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await callback("?code=abc123");

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://redline.example/app");
  });

  it("sends the reader to sign-in when the link has no code", async () => {
    const response = await callback("");

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://redline.example/login");
  });

  it("sends the reader to sign-in when the code is rejected (expired, reused, or opened in another browser)", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "invalid request" } });

    const response = await callback("?code=stale");

    expect(response.headers.get("location")).toBe("https://redline.example/login");
  });

  it("sends the reader to sign-in when no Supabase project is configured", async () => {
    createClient.mockResolvedValue(null);

    const response = await callback("?code=abc123");

    expect(response.headers.get("location")).toBe("https://redline.example/login");
  });

  it("never redirects anywhere but its own two pages, whatever the query says", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await callback("?code=abc123&next=https://evil.example/steal");

    expect(response.headers.get("location")).toBe("https://redline.example/app");
  });
});
