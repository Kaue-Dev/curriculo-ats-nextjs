export const runtime = "nodejs";

function getBackendUrl() {
  return (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
}

export async function POST(request: Request) {
  const backendUrl = getBackendUrl();
  const cookie = request.headers.get("cookie") || "";
  const adminToken = request.headers.get("x-admin-token");

  const upstreamResponse = await fetch(`${backendUrl}/credits/reset`, {
    method: "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(adminToken ? { "x-admin-token": adminToken } : {}),
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

