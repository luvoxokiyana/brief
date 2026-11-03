import { useState, type FormEvent } from "react";
import type { StaffMember } from "../../lib/queries/staff";
import type { Task, TaskInput } from "../../lib/queries/tasks";

type Props = {
  staff: StaffMember[];
  initial?: Task | null;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
};

export default function TaskForm({ staff, initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [staffId, setStaffId] = useState(initial?.staff_id ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setError("A title is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: trimmed,
        staff_id: staffId || null,
        due_date: dueDate || null,
      });
    } catch {
      setError("Could not save. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="task-title" className="field-label">Task</label>
        <input
          id="task-title"
          type="text"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-base"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-due" className="field-label">
            Due date <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            id="task-due"
            type="date"
            value={dueDate ?? ""}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="task-staff" className="field-label">
            Assign to <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <select
            id="task-staff"
            value={staffId ?? ""}
            onChange={(e) => setStaffId(e.target.value)}
            className="input-base"
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-ink" role="alert">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting
            ? "Saving…"
            : initial
              ? "Save changes"
              : "Add task"}
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