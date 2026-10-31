import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}