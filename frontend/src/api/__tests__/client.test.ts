import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "../client";


describe("apiFetch client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns parsed JSON on successful 200 response", async () => {
    const mockData = { id: 1, name: "Calculus" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockData),
    } as unknown as Response);

    const result = await apiFetch<typeof mockData>("http://localhost:8082/notebooks/1");
    expect(result).toEqual(mockData);
  });

  it("handles 400 error with detail from response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ detail: "Notebook name cannot be empty" }),
    } as unknown as Response);

    await expect(apiFetch("http://localhost:8082/notebooks/")).rejects.toThrow(
      "Notebook name cannot be empty",
    );
  });

  it("handles 404 resource not found", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ detail: "Notebook not found" }),
    } as unknown as Response);

    await expect(apiFetch("http://localhost:8082/notebooks/999")).rejects.toThrow(
      "Notebook not found",
    );
  });

  it("handles 429 rate limit with friendly message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    await expect(apiFetch("http://localhost:8082/messages/")).rejects.toThrow(
      /AI request rate limit reached/,
    );
  });

  it("handles 502/503 temporary unavailable with friendly message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    await expect(apiFetch("http://localhost:8082/messages/")).rejects.toThrow(
      /temporarily experiencing high traffic/,
    );
  });

  it("handles network failure gracefully", async () => {
    const networkError = new TypeError("Failed to fetch");
    globalThis.fetch = vi.fn().mockRejectedValue(networkError);

    await expect(apiFetch("http://localhost:8082/notebooks/")).rejects.toThrow(
      /Unable to connect to the server/,
    );
  });

  it("handles timeout error gracefully", async () => {
    const timeoutError = new Error("The operation timed out");
    timeoutError.name = "TimeoutError";
    globalThis.fetch = vi.fn().mockRejectedValue(timeoutError);

    await expect(apiFetch("http://localhost:8082/notebooks/")).rejects.toThrow(
      /Request timed out/,
    );
  });
});

