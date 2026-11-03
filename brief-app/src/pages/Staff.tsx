import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listStaff,
  createStaff,
  updateStaff,
  setStaffActive,
  canEditStaff,
  type StaffMember,
  type StaffInput,
} from "../lib/queries/staff";
import StaffForm from "../components/staff/StaffForm";
import { Link } from "react-router-dom";

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; staff: StaffMember };

export default function Staff() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const canEdit = canEditStaff(profile?.role);

  const load = async () => {
    try {
      const rows = await listStaff();
      setStaff(rows);
      setLoadError(null);
    } catch {
      setLoadError("Could not load staff. Try refreshing.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (input: StaffInput) => {
    if (!profile?.firm_id) {
      throw new Error("No firm_id on profile");
    }
    await createStaff(input, profile.firm_id);
    setMode({ kind: "list" });
    await load();
  };

  const handleEdit = async (input: StaffInput, id: string) => {
    await updateStaff(id, input);
    setMode({ kind: "list" });
    await load();
  };

  const handleToggleActive = async (s: StaffMember) => {
    setBusyId(s.id);
    try {
      await setStaffActive(s.id, !s.is_active);
      await load();
    } catch {
      // Keep the row as-is; the load() will re-fetch and reconcile.
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Firm
          </p>
          <h1 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-ink">
            Staff
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            The people who take consultations and appear in court.
          </p>
        </div>

        {canEdit && mode.kind === "list" && (
          <button
            type="button"
            onClick={() => setMode({ kind: "create" })}
            className="btn-primary"
          >
            Add staff
          </button>
        )}
      </header>

      {mode.kind === "create" && (
        <section className="mb-8 border border-rule rounded-sm bg-paper p-6 max-w-lg">
          <h2 className="font-editorial text-lg font-medium text-ink mb-4">
            New staff member
          </h2>
          <StaffForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setMode({ kind: "list" })}
          />
        </section>
      )}

      {mode.kind === "edit" && (
        <section className="mb-8 border border-rule rounded-sm bg-paper p-6 max-w-lg">
          <h2 className="font-editorial text-lg font-medium text-ink mb-4">
            Edit {mode.staff.full_name}
          </h2>
          <StaffForm
            mode="edit"
            initial={{
              full_name: mode.staff.full_name,
              email: mode.staff.email,
            }}
            onSubmit={(input) => handleEdit(input, mode.staff.id)}
            onCancel={() => setMode({ kind: "list" })}
          />
        </section>
      )}

      {loadError && (
        <p className="text-sm text-ink mb-4" role="alert">
          {loadError}
        </p>
      )}

      {staff === null && !loadError && (
        <p className="text-sm text-ink-muted">Loading…</p>
      )}

      {staff !== null && staff.length === 0 && (
        <div className="border border-rule rounded-sm p-8 text-center">
          <p className="text-sm text-ink-muted">
            No staff yet.
            {canEdit ? " Add the first person to get started." : ""}
          </p>
        </div>
      )}

      {staff !== null && staff.length > 0 && (
        <ul className="border border-rule rounded-sm divide-y divide-rule bg-paper">
          {staff.map((s) => (
            <li
              key={s.id}
              className="px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${s.is_active ? "text-ink" : "text-ink-muted line-through"
                    }`}
                >
                  {s.full_name}
                </p>
                <p className="text-xs text-ink-muted truncate">
                  {s.email ?? "No email on file"}
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/staff/${s.id}/availability`} className="btn-quiet">
                    Availability
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode({ kind: "edit", staff: s })}
                    className="btn-quiet"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s)}
                    disabled={busyId === s.id}
                    className="btn-quiet"
                  >
                    {busyId === s.id
                      ? "…"
                      : s.is_active
                        ? "Deactivate"
                        : "Reactivate"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}