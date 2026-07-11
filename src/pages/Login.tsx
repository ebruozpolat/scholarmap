import { Navigate } from "react-router";

// Guest mode: authentication is disabled. Any visit to /login goes straight
// into the app so every feature is usable without signing in.
export default function Login() {
  return <Navigate to="/app" replace />;
}
