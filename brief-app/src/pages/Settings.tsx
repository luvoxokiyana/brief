import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="font-editorial text-3xl font-medium tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Signed in as {profile?.full_name} ({profile?.role}).
      </p>
    </div>
  );
}