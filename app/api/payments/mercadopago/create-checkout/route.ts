export const runtime = "nodejs";

function getBackendUrl() {
  return (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
}

export async function POST(request: Request) {
  const backendUrl = getBackendUrl();
  const cookie = request.headers.get("cookie") || "";

  const upstreamResponse = await fetch(`${backendUrl}/payments/mercadopago/create-checkout`, {
    method: "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
    },
  });

  const contentType = upstreamResponse.headers.get("content-type") || "application/json";
  const responseHeaders = new Headers();
  responseHeaders.set("content-type", contentType);
  const setCookie = upstreamResponse.headers.get("set-cookie");
  if (setCookie) responseHeaders.set("set-cookie", setCookie);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

