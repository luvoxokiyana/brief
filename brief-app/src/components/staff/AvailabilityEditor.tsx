import { useState } from "react";
import type { AvailabilityInput } from "../../lib/queries/availability";

type Draft = AvailabilityInput & { key: string; id?: string };

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

let nextKey = 1;
const newKey = () => `w-${nextKey++}`;

type Props = {
  initial: Array<AvailabilityInput & { id?: string }>;
  onSave: (windows: Array<AvailabilityInput & { id?: string }>) => Promise<void>;
  onCancel: () => void;
};

export default function AvailabilityEditor({ initial, onSave, onCancel }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(
    initial.map((w) => ({ ...w, key: w.id ?? newKey() }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const windowsFor = (weekday: number) =>
    drafts.filter((d) => d.weekday === weekday);

  const addWindow = (weekday: number) => {
    setDrafts((prev) => [
      ...prev,
      {
        key: newKey(),
        weekday,
        start_time: "09:00",
        end_time: "17:00",
      },
    ]);
  };

  const updateWindow = (key: string, patch: Partial<Draft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d))
    );
  };

  const removeWindow = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const validate = (): string | null => {
    for (const d of drafts) {
      if (!d.start_time || !d.end_time) {
        return "Every window needs a start and end time.";
      }
      if (d.start_time >= d.end_time) {
        return "End time must be after start time.";
      }
    }
    return null;
  };

  const handleSave = async () => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      await onSave(
        drafts.map((d) => ({
          id: d.id,
          weekday: d.weekday,
          start_time: d.start_time,
          end_time: d.end_time,
        }))
      );
    } catch {
      setError("Could not save. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {WEEKDAYS.map((day) => (
        <section key={day.value}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-ink">{day.label}</h3>
            <button
              type="button"
              onClick={() => addWindow(day.value)}
              className="btn-quiet"
            >
              Add window
            </button>
          </div>

          {windowsFor(day.value).length === 0 ? (
            <p className="text-xs text-ink-muted pl-1">Not available.</p>
          ) : (
            <ul className="space-y-2">
              {windowsFor(day.value).map((w) => (
                <li
                  key={w.key}
                  className="flex items-center gap-2 border border-rule rounded-sm px-3 py-2 bg-paper"
                >
                  <input
                    type="time"
                    value={w.start_time}
                    onChange={(e) =>
                      updateWindow(w.key, { start_time: e.target.value })
                    }
                    className="input-base h-9 max-w-[9rem]"
                  />
                  <span className="text-sm text-ink-muted">to</span>
                  <input
                    type="time"
                    value={w.end_time}
                    onChange={(e) =>
                      updateWindow(w.key, { end_time: e.target.value })
                    }
                    className="input-base h-9 max-w-[9rem]"
                  />
                  <button
                    type="button"
                    onClick={() => removeWindow(w.key)}
                    className="btn-quiet ml-auto"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {error && (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-rule mt-6 pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? "Saving…" : "Save availability"}
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
    </div>
  );
}