import { useEffect, useState } from "react";
import {
  listEventsInRange,
  type BriefEvent,
} from "../../lib/queries/events";
import { listStaff, type StaffMember } from "../../lib/queries/staff";
import {
  startOfWeek,
  addDays,
  toDateKey,
  formatTime,
} from "../../lib/dates";

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08..18
const ROW_PX = 40;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function WeeklyCalendar() {
  const [events, setEvents] = useState<BriefEvent[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const monday = startOfWeek(new Date());
    const nextMonday = addDays(monday, 7);

    Promise.all([
      listEventsInRange(monday.toISOString(), nextMonday.toISOString()),
      listStaff(),
    ])
      .then(([rows, staffList]) => {
        if (cancelled) return;
        setEvents(rows);
        setStaff(staffList);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the week.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const monday = startOfWeek(new Date());
  const weekDays = WEEKDAYS.map((label, i) => ({
    label,
    date: addDays(monday, i),
  }));

  const staffName = (id: string) =>
    staff?.find((s) => s.id === id)?.full_name ?? "";

  const eventsOnDay = (dayKey: string) =>
    (events ?? []).filter((e) => toDateKey(new Date(e.start_at)) === dayKey);

  return (
    <section
      className="border border-rule rounded-sm bg-paper overflow-hidden"
      aria-labelledby="week-title"
    >
      <header className="px-5 py-4 border-b border-rule flex items-center justify-between">
        <h2 id="week-title" className="font-editorial text-lg font-medium text-ink">
          This week
        </h2>
        <p className="text-xs text-ink-muted">
          {monday.toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </header>

      {error && (
        <p className="px-5 py-4 text-sm text-ink-muted">{error}</p>
      )}

      {!error && events === null && (
        <p className="px-5 py-4 text-sm text-ink-muted">Loading…</p>
      )}

      {!error && events !== null && (
        <div className="grid grid-cols-[3rem_repeat(5,1fr)]">
          <div className="border-b border-rule" />
          {weekDays.map(({ label, date }) => (
            <div
              key={label}
              className="border-b border-l border-rule py-2 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                {label}
              </p>
              <p className="text-xs text-ink mt-0.5">{date.getDate()}</p>
            </div>
          ))}

          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-10 pr-2 text-right text-[10px] leading-none text-ink-muted translate-y-[-0.5em]"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {weekDays.map(({ label, date }) => {
            const dayKey = toDateKey(date);
            const dayEvents = eventsOnDay(dayKey);
            return (
              <div
                key={label}
                className="relative border-l border-rule"
                style={{ height: ROW_PX * HOURS.length }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-rule"
                    style={{ height: ROW_PX }}
                  />
                ))}

                {dayEvents.map((e) => {
                  const start = new Date(e.start_at);
                  const end = new Date(e.end_at);
                  const startHour =
                    start.getHours() + start.getMinutes() / 60;
                  const endHour =
                    end.getHours() + end.getMinutes() / 60;
                  const top = (startHour - 8) * ROW_PX;
                  const height = Math.max((endHour - startHour) * ROW_PX, 20);
                  return (
                    <div
                      key={e.id}
                      className="absolute left-0.5 right-0.5 rounded-sm bg-ink text-paper text-[10px] leading-tight px-1.5 py-1 overflow-hidden"
                      style={{ top, height }}
                      title={`${formatTime(start)} ${e.client_name ?? ""} ${staffName(e.staff_id)}`}
                    >
                      <span className="block truncate">
                        {formatTime(start)} {e.client_name ?? ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}