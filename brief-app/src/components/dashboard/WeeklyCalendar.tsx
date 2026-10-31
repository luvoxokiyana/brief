type CalendarEvent = {
  id: string;
  title: string;
  day: number; // 0 = Monday … 4 = Friday
  startHour: number; // 9..17, decimal for minutes
  durationHours: number;
};

const HOURS = Array.from({ length: 9 }, (_, i) => 9 + i); // 9..17
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const DUMMY_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Consultation — Smith", day: 1, startHour: 10, durationHours: 1 },
  { id: "e2", title: "Deposition — High Court", day: 3, startHour: 14, durationHours: 2 },
];

const ROW_PX = 48;

export default function WeeklyCalendar() {
  return (
    <section
      className="border border-rule rounded-sm bg-paper overflow-hidden"
      aria-labelledby="week-title"
    >
      <header className="px-5 py-4 border-b border-rule flex items-center justify-between">
        <h2 id="week-title" className="font-editorial text-lg font-medium text-ink">
          This week
        </h2>
        <p className="text-xs text-ink-muted">Week of — dummy</p>
      </header>

      <div className="grid grid-cols-[4rem_repeat(5,1fr)]">
        {/* Day headers */}
        <div className="border-b border-rule" />
        {DAYS.map((day) => (
          <div
            key={day}
            className="border-b border-l border-rule py-2 text-center
                       text-xs font-medium uppercase tracking-wider text-ink-muted"
          >
            {day}
          </div>
        ))}

        {/* Time labels */}
        <div className="relative">
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-12 pr-2 text-right text-[10px] leading-none text-ink-muted
                         translate-y-[-0.5em]"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day, dayIdx) => (
          <div
            key={day}
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

            {DUMMY_EVENTS.filter((e) => e.day === dayIdx).map((e) => {
              const top = (e.startHour - 9) * ROW_PX;
              const height = e.durationHours * ROW_PX;
              return (
                <div
                  key={e.id}
                  className="absolute left-1 right-1 rounded-sm
                             bg-ink text-paper text-xs px-2 py-1 overflow-hidden"
                  style={{ top, height }}
                >
                  {e.title}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}