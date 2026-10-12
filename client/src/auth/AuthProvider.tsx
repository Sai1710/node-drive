import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { AuthContext, type AuthContextValue, type AuthUser } from "./AuthContext";
import { decodeToken, getSession, setSession, subscribe, type Session } from "./session";

const userFrom = (session: Session | null): AuthUser | null => {
  const payload = session && decodeToken(session.accessToken);
  return payload ? { id: payload._id, email: payload.email ?? "" } : null;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setLocal] = useState(getSession);

  useEffect(() => subscribe(setLocal), []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    setSession({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
  }, []);

  const signup = useCallback(
    async (email: string, password: string) => {
      await authApi.signup(email, password);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Sign out locally even if the server call fails.
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: userFrom(session), login, signup, logout }),
    [session, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
