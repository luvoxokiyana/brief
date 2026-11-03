import { useEffect, useState } from "react";
import { listUpcomingEvents, type BriefEvent } from "../../lib/queries/events";
import { formatShortDate, formatTime } from "../../lib/dates";

const KIND_LABEL: Record<BriefEvent["kind"], string> = {
  consultation: "Consultation",
  deposition: "Deposition",
  appearance: "Appearance",
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState<BriefEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUpcomingEvents(4)
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load upcoming events.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="border border-rule rounded-sm bg-paper"
      aria-labelledby="upcoming-title"
    >
      <header className="px-5 py-4 border-b border-rule">
        <h2 id="upcoming-title" className="font-editorial text-lg font-medium text-ink">
          Upcoming
        </h2>
      </header>

      {error && (
        <p className="px-5 py-4 text-sm text-ink-muted">{error}</p>
      )}

      {!error && events === null && (
        <p className="px-5 py-4 text-sm text-ink-muted">Loading…</p>
      )}

      {!error && events !== null && events.length === 0 && (
        <p className="px-5 py-4 text-sm text-ink-muted">
          Nothing scheduled yet.
        </p>
      )}

      {!error && events !== null && events.length > 0 && (
        <ul className="divide-y divide-rule">
          {events.map((e) => (
            <li key={e.id} className="px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-ink-muted">
                {KIND_LABEL[e.kind]}
              </p>
              <p className="mt-1 text-sm text-ink">
                {e.client_name ?? "No client"}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatShortDate(e.start_at)} · {formatTime(e.start_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}