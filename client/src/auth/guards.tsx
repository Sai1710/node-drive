import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

/** Renders child routes only for signed-in users. */
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Keeps signed-in users away from the login and signup pages. */
export function RedirectIfAuthed() {
  const { user } = useAuth();
  if (user) return <Navigate to="/drive" replace />;
  return <Outlet />;
}
