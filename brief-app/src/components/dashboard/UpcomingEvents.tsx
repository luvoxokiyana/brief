type UpcomingEvent = {
  id: string;
  title: string;
  when: string;
  kind: "Consultation" | "Deposition" | "Appearance";
};

const DUMMY_EVENTS: UpcomingEvent[] = [
  { id: "u1", title: "Consultation — Smith", when: "Tue, 10:00", kind: "Consultation" },
  { id: "u2", title: "Deposition — High Court", when: "Thu, 14:00", kind: "Deposition" },
  { id: "u3", title: "Appearance — Magistrate's", when: "Fri, 09:30", kind: "Appearance" },
  { id: "u4", title: "Consultation — Ndlovu", when: "Mon, 11:00", kind: "Consultation" },
];

export default function UpcomingEvents() {
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

      <ul className="divide-y divide-rule">
        {DUMMY_EVENTS.map((e) => (
          <li key={e.id} className="px-5 py-3">
            <p className="text-xs uppercase tracking-wider text-ink-muted">
              {e.kind}
            </p>
            <p className="mt-1 text-sm text-ink">{e.title}</p>
            <p className="mt-1 text-xs text-ink-muted">{e.when}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}