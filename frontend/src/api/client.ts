/**
 * Centralized API client with descriptive, user-friendly error handling.
 */

export const API_BASE_URL: string =
  (import.meta.env?.VITE_API_URL as string) || "http://localhost:8000";

export async function apiFetch<T>(

  url: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    const signal = options?.signal || AbortSignal.timeout(45000);
    response = await fetch(url, { ...options, signal });
  } catch (networkErr: any) {
    if (networkErr?.name === "TimeoutError" || networkErr?.name === "AbortError") {
      throw new Error(
        "Request timed out. The server or AI model took too long to respond. Please try again.",
      );
    }
    // Thrown by browser when server is unreachable, connection refused, or network is down
    if (
      networkErr?.name === "TypeError" ||
      networkErr?.message?.toLowerCase().includes("fetch")
    ) {
      throw new Error(
        "Unable to connect to the server. Please check your internet connection or try again in a moment.",
      );
    }
    throw new Error(
      networkErr?.message || "A network error occurred. Please try again.",
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorDetail = errorJson.detail;
      } else if (errorJson?.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // Body was not JSON
    }

    if (response.status === 400) {
      throw new Error(errorDetail || "Invalid request. Please check your input.");
    }

    if (response.status === 404) {
      throw new Error(
        errorDetail || "The requested resource could not be found.",
      );
    }

    if (response.status === 429) {
      throw new Error(
        errorDetail ||
          "AI request rate limit reached. Please wait ~30 seconds and try again.",
      );
    }

    if (response.status === 502 || response.status === 503) {
      throw new Error(
        errorDetail ||
          "The AI service is temporarily experiencing high traffic. Please try again shortly.",
      );
    }

    if (response.status >= 500) {
      throw new Error(
        errorDetail ||
          "The server encountered an unexpected error while processing your request. Please try again in a moment.",
      );
    }

    throw new Error(
      errorDetail || `Request failed with status code ${response.status}.`,
    );
  }

  return response.json();
}
