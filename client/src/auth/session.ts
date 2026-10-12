// Holds the JWTs issued by auth-service and notifies subscribers on change.
// Lives outside React so the HTTP layer can refresh or clear it directly.

export interface Session {
  accessToken: string;
  refreshToken: string | null;
}

export interface TokenPayload {
  _id: string;
  email?: string;
  exp?: number; // seconds since epoch
}

const ACCESS_KEY = "drive.access_token";
const REFRESH_KEY = "drive.refresh_token";

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

export function decodeToken(token: string): TokenPayload | null {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    const payload = JSON.parse(json);
    return payload && typeof payload._id === "string" ? payload : null;
  } catch {
    return null;
  }
}

/** True when the token is malformed or expires within `skewSeconds`. */
export function isExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeToken(token)?.exp;
  if (!exp) return false; // no exp claim: let the server decide
  return exp * 1000 - skewSeconds * 1000 <= Date.now();
}

function read(): Session | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    if (!accessToken || !decodeToken(accessToken)) return null;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    // Both tokens dead means the user must sign in again.
    if (isExpired(accessToken, 0) && (!refreshToken || isExpired(refreshToken, 0))) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

let current: Session | null = read();

export const getSession = () => current;

export function setSession(session: Session | null) {
  current = session;
  try {
    if (session) {
      localStorage.setItem(ACCESS_KEY, session.accessToken);
      if (session.refreshToken) localStorage.setItem(REFRESH_KEY, session.refreshToken);
      else localStorage.removeItem(REFRESH_KEY);
    } else {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    // Storage unavailable (private mode); session stays in memory only.
  }
  listeners.forEach((l) => l(session));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Keep tabs in sync: signing out in one tab signs out the others.
window.addEventListener("storage", (e) => {
  if (e.key !== ACCESS_KEY && e.key !== REFRESH_KEY && e.key !== null) return;
  current = read();
  listeners.forEach((l) => l(current));
});
