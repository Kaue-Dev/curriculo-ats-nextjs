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
    const init: NodeRequestInit = {
      method: "POST",
      headers: {
        "content-type": contentType,
      },
      body: request.body,
      signal: abortController.signal,
    };

    // Node.js fetch requires `duplex: "half"` when sending a streamed request body.
    // It's not part of the DOM typings, so we keep it typed via `NodeRequestInit`.
    init.duplex = "half";

    const upstreamResponse = await fetch(`${backendUrl}/resume/evaluate`, init as RequestInit);

    const upstreamContentType = upstreamResponse.headers.get("content-type") || "application/json";

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "content-type": upstreamContentType,
      },
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
