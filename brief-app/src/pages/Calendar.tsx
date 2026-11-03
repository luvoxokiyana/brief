import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listEventsInRange, type BriefEvent } from "../lib/queries/events";
import { getDefaultRoom, type Room } from "../lib/queries/rooms";
import { listStaff, type StaffMember } from "../lib/queries/staff";
import EventForm from "../components/events/EventForm";
import Modal from "../components/ui/Modal";
import {
  startOfWeek,
  addDays,
  toDateKey,
  formatShortDate,
  formatTime,
} from "../lib/dates";

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08..18
const ROW_PX = 56;

type FormState =
  | { kind: "closed" }
  | { kind: "create"; date: string; time: string }
  | { kind: "edit"; event: BriefEvent };

export default function Calendar() {
  const { profile } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [events, setEvents] = useState<BriefEvent[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<FormState>({ kind: "closed" });
  const [error, setError] = useState<string | null>(null);

  const canEdit = profile?.role === "admin";

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const reload = async () => {
    try {
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 7).toISOString();
      const [rows, staffList, defaultRoom] = await Promise.all([
        listEventsInRange(from, to),
        listStaff(),
        getDefaultRoom(),
      ]);
      setEvents(rows);
      setStaff(staffList);
      setRoom(defaultRoom);
      setError(null);
    } catch {
      setError("Could not load the calendar. Try refreshing.");
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const staffName = (id: string) =>
    staff?.find((s) => s.id === id)?.full_name ?? "Staff";

  const eventsOnDay = (dayKey: string) =>
    (events ?? []).filter((e) => toDateKey(new Date(e.start_at)) === dayKey);

  const openCreate = (date: Date, hour: number) => {
    if (!canEdit) return;
    setForm({
      kind: "create",
      date: toDateKey(date),
      time: `${String(hour).padStart(2, "0")}:00`,
    });
  };

  const closeForm = () => setForm({ kind: "closed" });

  const onSaved = async () => {
    closeForm();
    await reload();
  };

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Calendar
          </p>
          <h1 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-ink">
            Week of {formatShortDate(weekStart)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="btn-quiet"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="btn-quiet"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="btn-quiet"
          >
            →
          </button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-ink mb-4" role="alert">{error}</p>
      )}

      {events === null && !error && (
        <p className="text-sm text-ink-muted">Loading…</p>
      )}

      {events !== null && (
        <section className="border border-rule rounded-sm bg-paper overflow-x-auto">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(8rem,1fr))] min-w-[52rem]">
            <div className="border-b border-rule" />
            {weekDays.map((d) => (
              <div
                key={toDateKey(d)}
                className="border-b border-l border-rule py-2 text-center"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  {d.toLocaleDateString("en-ZA", { weekday: "short" })}
                </p>
                <p className="text-sm text-ink mt-0.5">{d.getDate()}</p>
              </div>
            ))}

            <div className="relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="h-14 pr-2 text-right text-[10px] leading-none text-ink-muted translate-y-[-0.5em]"
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dayKey = toDateKey(day);
              const dayEvents = eventsOnDay(dayKey);
              return (
                <div
                  key={dayKey}
                  className="relative border-l border-rule"
                  style={{ height: ROW_PX * HOURS.length }}
                >
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => openCreate(day, h)}
                      className="block w-full h-14 border-b border-rule hover:bg-paper-warm focus:outline-none focus-visible:bg-paper-warm"
                      aria-label={`Create event on ${formatShortDate(day)} at ${h}:00`}
                    />
                  ))}

                  {dayEvents.map((e) => {
                    const start = new Date(e.start_at);
                    const end = new Date(e.end_at);
                    const startHour =
                      start.getHours() + start.getMinutes() / 60;
                    const endHour = end.getHours() + end.getMinutes() / 60;
                    const top = (startHour - 8) * ROW_PX;
                    const height = Math.max((endHour - startHour) * ROW_PX, 24);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() =>
                          canEdit && setForm({ kind: "edit", event: e })
                        }
                        className="absolute left-1 right-1 rounded-sm bg-ink text-paper text-xs px-2 py-1 overflow-hidden text-left"
                        style={{ top, height }}
                      >
                        <span className="block truncate">
                          {e.client_name ?? "—"}
                        </span>
                        <span className="block truncate text-paper/80 text-[10px]">
                          {formatTime(start)} {staffName(e.staff_id)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal
        open={form.kind !== "closed"}
        onClose={closeForm}
        title={form.kind === "create" ? "New event" : "Edit event"}
      >
        {staff && room && form.kind !== "closed" && (
          <EventForm
            staff={staff}
            room={room}
            initial={form.kind === "edit" ? form.event : null}
            defaultDate={form.kind === "create" ? form.date : undefined}
            defaultTime={form.kind === "create" ? form.time : undefined}
            onSaved={onSaved}
            onCancel={closeForm}
          />
        )}
      </Modal>
    </div>
  );
}