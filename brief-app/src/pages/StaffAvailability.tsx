import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  listAvailability,
  saveAvailability,
  type AvailabilityWindow,
  type AvailabilityInput,
} from "../lib/queries/availability";
import AvailabilityEditor from "../components/staff/AvailabilityEditor";

type StaffRow = {
  id: string;
  full_name: string;
};

export default function StaffAvailability() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffRow | null>(null);
  const [windows, setWindows] = useState<AvailabilityWindow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const [staffRes, windowsList] = await Promise.all([
          supabase
            .from("staff")
            .select("id, full_name")
            .eq("id", id)
            .single(),
          listAvailability(id),
        ]);

        if (cancelled) return;

        if (staffRes.error || !staffRes.data) {
          setError("Staff member not found.");
          return;
        }
        setStaff(staffRes.data as StaffRow);
        setWindows(windowsList);
      } catch {
        if (!cancelled) setError("Could not load availability. Try refreshing.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async (
    next: Array<AvailabilityInput & { id?: string }>
  ) => {
    if (!id || !profile?.firm_id || !windows) return;
    await saveAvailability(id, profile.firm_id, windows, next);
    const fresh = await listAvailability(id);
    setWindows(fresh);
    setEditing(false);
  };

  if (error) {
    return (
      <div>
        <Link to="/staff" className="btn-quiet mb-4">
          ← Back to staff
        </Link>
        <p className="text-sm text-ink" role="alert">{error}</p>
      </div>
    );
  }

  if (!staff || windows === null) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div>
      <Link to="/staff" className="btn-quiet mb-4 -ml-3">
        ← Back to staff
      </Link>

      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Availability
        </p>
        <h1 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-ink">
          {staff.full_name}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Weekly windows when this person can be booked.
        </p>
      </header>

      {!editing ? (
        <section className="border border-rule rounded-sm bg-paper">
          {windows.length === 0 ? (
            <p className="text-sm text-ink-muted p-6">
              No windows set. Add a window to start.
            </p>
          ) : (
            <ul className="divide-y divide-rule">
              {windows.map((w) => (
                <li
                  key={w.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-ink">
                    {WEEKDAY_LABEL[w.weekday]} {w.start_time.slice(0, 5)}–
                    {w.end_time.slice(0, 5)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-4 border-t border-rule">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-primary"
            >
              Edit availability
            </button>
          </div>
        </section>
      ) : (
        <section className="border border-rule rounded-sm bg-paper p-6">
          <AvailabilityEditor
            initial={windows.map((w) => ({
              id: w.id,
              weekday: w.weekday,
              start_time: w.start_time.slice(0, 5),
              end_time: w.end_time.slice(0, 5),
            }))}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </section>
      )}
    </div>
  );
}

const WEEKDAY_LABEL: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};