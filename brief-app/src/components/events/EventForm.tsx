import { useEffect, useState, type FormEvent } from "react";
import type { StaffMember } from "../../lib/queries/staff";
import type { Room } from "../../lib/queries/rooms";
import {
  createEvent,
  updateEvent,
  ConflictError,
  type BriefEvent,
  type EventKind,
} from "../../lib/queries/events";
import { combineDateAndTime, isoToDateInput, isoToTimeInput } from "../../lib/dates";

type Props = {
  staff: StaffMember[];
  room: Room;
  initial?: BriefEvent | null;
  defaultDate?: string; // "YYYY-MM-DD" when creating by clicking a slot
  defaultTime?: string; // "HH:MM"
  onSaved: () => void;
  onCancel: () => void;
};

const KIND_LABEL: Record<EventKind, string> = {
  consultation: "Consultation",
  deposition: "Deposition",
  appearance: "Appearance",
};

export default function EventForm({
  staff,
  room,
  initial,
  defaultDate,
  defaultTime,
  onSaved,
  onCancel,
}: Props) {
  const [staffId, setStaffId] = useState(initial?.staff_id ?? staff[0]?.id ?? "");
  const [kind, setKind] = useState<EventKind>(initial?.kind ?? "consultation");
  const [date, setDate] = useState(
    initial ? isoToDateInput(initial.start_at) : defaultDate ?? ""
  );
  const [startTime, setStartTime] = useState(
    initial ? isoToTimeInput(initial.start_at) : defaultTime ?? "09:00"
  );
  const [endTime, setEndTime] = useState(
    initial ? isoToTimeInput(initial.end_at) : "10:00"
  );
  const [clientName, setClientName] = useState(initial?.client_name ?? "");
  const [matterRef, setMatterRef] = useState(initial?.matter_ref ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setStaffId(staff[0]?.id ?? "");
    }
  }, [staff, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffId) {
      setError("Choose a staff member.");
      return;
    }
    if (!date || !startTime || !endTime) {
      setError("Date, start and end are required.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);

    const input = {
      staff_id: staffId,
      room_id: room.id,
      kind,
      start_at: combineDateAndTime(date, startTime),
      end_at: combineDateAndTime(date, endTime),
      client_name: clientName || null,
      matter_ref: matterRef || null,
      notes: notes || null,
    };

    try {
      if (initial) {
        await updateEvent(initial.id, input);
      } else {
        await createEvent(input);
      }
      onSaved();
    } catch (err) {
      if (err instanceof ConflictError) {
        setError("That time is already booked for this staff member or room.");
      } else {
        setError("Could not save. Try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="ev-staff" className="field-label">Staff</label>
        <select
          id="ev-staff"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="input-base"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ev-kind" className="field-label">Type</label>
        <select
          id="ev-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as EventKind)}
          className="input-base"
        >
          {(Object.keys(KIND_LABEL) as EventKind[]).map((k) => (
            <option key={k} value={k}>{KIND_LABEL[k]}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="ev-date" className="field-label">Date</label>
          <input
            id="ev-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-base"
            required
          />
        </div>
        <div>
          <label htmlFor="ev-start" className="field-label">Start</label>
          <input
            id="ev-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input-base"
            required
          />
        </div>
        <div>
          <label htmlFor="ev-end" className="field-label">End</label>
          <input
            id="ev-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input-base"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="ev-client" className="field-label">
          Client <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input
          id="ev-client"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="input-base"
        />
      </div>

      <div>
        <label htmlFor="ev-matter" className="field-label">
          Matter reference <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input
          id="ev-matter"
          type="text"
          value={matterRef}
          onChange={(e) => setMatterRef(e.target.value)}
          className="input-base"
        />
      </div>

      <div>
        <label htmlFor="ev-notes" className="field-label">
          Notes <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="ev-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-base h-20 py-2"
          rows={3}
        />
      </div>

      <p className="text-xs text-ink-muted">
        Room: {room.name}
      </p>

      {error && (
        <p className="text-sm text-ink" role="alert">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting
            ? "Saving…"
            : initial
              ? "Save changes"
              : "Create event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-quiet"
        >
          Cancel
        </button>
        {initial && (
          <DeleteButton id={initial.id} onDeleted={onSaved} />
        )}
      </div>
    </form>
  );
}

// Small inline component so the delete flow doesn't clutter the main form.
// Same file, no separate import.
import { deleteEvent } from "../../lib/queries/events";

function DeleteButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteEvent(id);
      onDeleted();
    } catch {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn-quiet ml-auto text-ink-muted"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="text-xs text-ink-muted">Delete this event?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="btn-quiet"
      >
        {busy ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="btn-quiet"
      >
        Cancel
      </button>
    </span>
  );
}