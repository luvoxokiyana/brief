import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import loginImage from "../assets/images/login.jpg";

export default function Login() {
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError("Email or password is incorrect.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-paper">
      {/* Form panel */}
      <div className="flex flex-col min-h-screen px-6 sm:px-10 md:px-16 py-10">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-10">
            <p className="font-editorial text-2xl font-medium tracking-tight text-ink">
              Brief
            </p>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-ink">
            Sign in to Brief.
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            The firm's admin, in one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
              />
            </div>

            {error && (
              <p className="text-sm text-ink" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-xs text-ink-muted">
            Access is by invitation from your firm's administrator.
          </p>
        </div>

        <p className="mt-10 text-xs text-ink-muted">
          © Brief
        </p>
      </div>

      {/* Image panel — hidden on mobile */}
      <div className="hidden md:block relative bg-paper-warm border-l border-rule overflow-hidden">
        <img
          src={loginImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}