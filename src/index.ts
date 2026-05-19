import { env } from "./env";
import { scrapeBusinesses } from "./services/scrape-businesses";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function unauthorized() {
  return jsonResponse(
    {
      error: "Unauthorized",
    },
    401,
  );
}

function badRequest(message: string) {
  return jsonResponse(
    {
      error: message,
    },
    400,
  );
}

Bun.serve({
  port: env.PORT,

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse({
        ok: true,
        service: "maps-lead-service",
      });
    }

    if (
      url.pathname === "/v1/scrape/google-places" &&
      request.method === "POST"
    ) {
      const authHeader = request.headers.get("authorization");
      const expectedHeader = `Bearer ${env.SERVICE_API_KEY}`;

      if (authHeader !== expectedHeader) {
        return unauthorized();
      }

      let body: unknown;

      try {
        body = await request.json();
      } catch {
        return badRequest("Invalid JSON body");
      }

      const payload = body as {
        query?: unknown;
        location?: unknown;
        limit?: unknown;
      };

      if (
        typeof payload.query !== "string" ||
        payload.query.trim().length < 3
      ) {
        return badRequest("query must be a string with at least 3 characters");
      }

      const location =
        typeof payload.location === "string"
          ? payload.location.trim() || undefined
          : undefined;

      const limit =
        typeof payload.limit === "number" && Number.isFinite(payload.limit)
          ? Math.min(Math.max(Math.floor(payload.limit), 1), 50)
          : 20;

      try {
        const result = await scrapeBusinesses({
          query: payload.query.trim(),
          location,
          limit,
        });

        return jsonResponse(result);
      } catch (error) {
        return jsonResponse(
          {
            error: "Scrape job failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          500,
        );
      }
    }

    return jsonResponse(
      {
        error: "Not found",
      },
      404,
    );
  },
});

console.log(`maps-lead-service running on http://localhost:${env.PORT}`);
