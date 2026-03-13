export const runtime = "nodejs";

function getBackendUrl() {
  return (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
}

type NodeRequestInit = RequestInit & { duplex?: "half" };

const UPSTREAM_TIMEOUT_MS = 90_000;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return Response.json({ error: "Envie um arquivo via multipart/form-data." }, { status: 400 });
  }

  if (!request.body) {
    return Response.json({ error: "Arquivo de currículo é obrigatório." }, { status: 400 });
  }

  const backendUrl = getBackendUrl();
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";
    const adminToken = request.headers.get("x-admin-token");

    const init: NodeRequestInit = {
      method: "POST",
      headers: {
        "content-type": contentType,
        ...(cookie ? { cookie } : {}),
        ...(adminToken ? { "x-admin-token": adminToken } : {}),
      },
      body: request.body,
      signal: abortController.signal,
    };

    // Node.js fetch requires `duplex: "half"` when sending a streamed request body.
    // It's not part of the DOM typings, so we keep it typed via `NodeRequestInit`.
    init.duplex = "half";

    const upstreamResponse = await fetch(`${backendUrl}/resume/evaluate`, init as RequestInit);

    const upstreamContentType = upstreamResponse.headers.get("content-type") || "application/json";

    const responseHeaders = new Headers();
    responseHeaders.set("content-type", upstreamContentType);
    const setCookie = upstreamResponse.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);
    const retryAfter = upstreamResponse.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("retry-after", retryAfter);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return Response.json({ error: "Timeout ao chamar o backend." }, { status: 504 });
    }

    return Response.json(
      {
        error:
          err instanceof Error
            ? `Erro ao chamar o backend: ${err.message}`
            : "Erro ao chamar o backend.",
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
