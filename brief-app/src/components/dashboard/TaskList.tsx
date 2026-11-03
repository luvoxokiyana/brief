import { useEffect, useState } from "react";
import { listOpenTasks, toggleTask, type Task } from "../../lib/queries/tasks";
import { formatShortDate } from "../../lib/dates";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const rows = await listOpenTasks(5);
      setTasks(rows);
      setError(null);
    } catch {
      setError("Could not load tasks.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleToggle = async (t: Task) => {
    setBusyId(t.id);
    try {
      await toggleTask(t.id, !t.is_complete);
      await load();
    } catch {
      // reload reconciles with the DB regardless of outcome
      await load();
    } finally {
      setBusyId(null);
    }
  };

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

      {error && (
        <p className="px-5 py-4 text-sm text-ink-muted">{error}</p>
      )}

      {!error && tasks === null && (
        <p className="px-5 py-4 text-sm text-ink-muted">Loading…</p>
      )}

      {!error && tasks !== null && tasks.length === 0 && (
        <p className="px-5 py-4 text-sm text-ink-muted">
          No open tasks.
        </p>
      )}

      {!error && tasks !== null && tasks.length > 0 && (
        <ul className="divide-y divide-rule">
          {tasks.map((t) => (
            <li key={t.id} className="px-5 py-3 flex items-start gap-3">
              <button
                type="button"
                onClick={() => handleToggle(t)}
                disabled={busyId === t.id}
                aria-label={
                  t.is_complete ? "Mark task as incomplete" : "Mark task as complete"
                }
                className={`mt-1 inline-block w-4 h-4 border rounded-sm flex-shrink-0 transition-colors
                  ${t.is_complete ? "bg-ink border-ink" : "bg-transparent border-rule hover:border-ink"}`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    t.is_complete ? "text-ink-muted line-through" : "text-ink"
                  }`}
                >
                  {t.title}
                </p>
              </div>
              {t.due_date && (
                <span className="text-[11px] uppercase tracking-wider text-ink-muted flex-shrink-0">
                  {formatShortDate(t.due_date)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}