type Task = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

const DUMMY_TASKS: Task[] = [
  { id: "t1", title: "Prepare brief for Thursday", due: "Thu", done: false },
  { id: "t2", title: "Call client regarding deposition", due: "Fri", done: false },
  { id: "t3", title: "File signed affidavit", due: "Mon", done: true },
];

export default function TaskList() {
  return (
    <section
      className="border border-rule rounded-sm bg-paper"
      aria-labelledby="tasks-title"
    >
      <header className="px-5 py-4 border-b border-rule">
        <h2 id="tasks-title" className="font-editorial text-lg font-medium text-ink">
          Tasks
        </h2>
      </header>

      <ul className="divide-y divide-rule">
        {DUMMY_TASKS.map((t) => (
          <li key={t.id} className="px-5 py-3 flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-1 inline-block w-4 h-4 border border-rule rounded-sm flex-shrink-0 ${
                t.done ? "bg-ink border-ink" : "bg-transparent"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  t.done ? "text-ink-muted line-through" : "text-ink"
                }`}
              >
                {t.title}
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-ink-muted">
              {t.due}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}