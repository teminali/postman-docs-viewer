/**
 * API Proxy Route
 *
 * Forwards requests from the browser to external APIs to avoid CORS issues.
 * The client sends the target URL, method, headers, and body — this route
 * relays them and returns the response.
 */

import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB
const REQUEST_TIMEOUT = 30_000; // 30s

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      url,
      method = "GET",
      headers = {},
      body,
    } = payload as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string | null;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field" },
        { status: 400 }
      );
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Block private/internal addresses
    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.") ||
      host === "::1"
    ) {
      return NextResponse.json(
        { error: "Requests to private/internal addresses are not allowed" },
        { status: 403 }
      );
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        ...headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    };

    // Attach body for non-GET/HEAD methods
    if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
      if (body.length > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: "Request body too large (max 5MB)" },
          { status: 413 }
        );
      }
      fetchOptions.body = body;
    }

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const elapsed = Date.now() - startTime;

    // Read response
    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      elapsed,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Proxy request failed";

    // Timeout
    if (message.includes("timeout") || message.includes("aborted")) {
      return NextResponse.json(
        { error: "Request timed out (30s)" },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
