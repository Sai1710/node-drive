import { AUTH_API_URL } from "../config";
import { getSession, isExpired, setSession } from "../auth/session";

/** Shape every backend success response uses (ApiResponse in drive-common). */
interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the access token and refresh it when needed. */
  auth?: boolean;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

function errorMessage(body: unknown, res: Response): string {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  // The services register their JSON error handler before the routes, so
  // errors currently reach Express's default handler, which replies with HTML.
  if (typeof body === "string") {
    const pre = body.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1];
    const firstLine = decodeEntities((pre ?? "").split(/<br\s*\/?>/i)[0])
      .replace(/^\s*\w*Error:\s*/, "")
      .trim();
    if (firstLine) return firstLine;
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

// One refresh at a time, shared by every request that needs it.
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session?.refreshToken) return Promise.resolve(null);
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/refresh-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
      if (!res.ok) return null;
      const body = (await parseBody(res)) as ApiEnvelope<{ access_token?: string }> | null;
      const accessToken = body?.data?.access_token;
      if (!accessToken) return null;
      setSession({ accessToken, refreshToken: session.refreshToken });
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

const sessionExpired = () => {
  setSession(null);
  return new HttpError(401, "Your session has expired. Please sign in again.");
};

async function getAccessToken(): Promise<string> {
  const session = getSession();
  if (!session) throw sessionExpired();
  if (!isExpired(session.accessToken)) return session.accessToken;
  const refreshed = await refreshAccessToken();
  if (!refreshed) throw sessionExpired();
  return refreshed;
}

export async function request<T>(url: string, { method = "GET", body, auth = false }: RequestOptions = {}): Promise<T> {
  const send = (token?: string) =>
    fetch(url, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  try {
    const token = auth ? await getAccessToken() : undefined;
    res = await send(token);

    if (res.status === 401 && auth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await send(refreshed);
      } else {
        const session = getSession();
        // Only sign out when the token really is dead. A 401 on a fresh
        // token is a server-side rejection and is reported as an error.
        if (!session || isExpired(session.accessToken)) throw sessionExpired();
      }
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(0, `Cannot reach ${new URL(url).host}. Is the service running?`);
  }

  const parsed = await parseBody(res);
  if (!res.ok) throw new HttpError(res.status, errorMessage(parsed, res));
  return (parsed as ApiEnvelope<T>).data;
}
