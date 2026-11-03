import { useState, type FormEvent } from "react";
import type { StaffInput } from "../../lib/queries/staff";

type Props = {
  mode: "create" | "edit";
  initial?: { full_name: string; email: string | null };
  onSubmit: (input: StaffInput) => Promise<void>;
  onCancel: () => void;
};

export default function StaffForm({ mode, initial, onSubmit, onCancel }: Props) {
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("A name is required.");
      return;
    }
    if (trimmedEmail && !trimmedEmail.includes("@")) {
      setError("That email doesn't look complete.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        full_name: trimmedName,
        email: trimmedEmail ? trimmedEmail : null,
      });
    } catch (err) {
      // Generic on purpose: no raw error text from the DB in the UI.
      setError("Could not save. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="staff-name" className="field-label">
          Full name
        </label>
        <input
          id="staff-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input-base"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="staff-email" className="field-label">
          Email <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input
          id="staff-email"
          type="email"
          value={email ?? ""}
          onChange={(e) => setEmail(e.target.value)}
          className="input-base"
        />
      </div>

      {error && (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Add staff member"
              : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-quiet"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}