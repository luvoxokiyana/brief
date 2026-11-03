import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listStaff, type StaffMember } from "../lib/queries/staff";
import {
  listAllTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  type Task,
  type TaskInput,
} from "../lib/queries/tasks";
import TaskForm from "../components/tasks/TaskForm";
import Modal from "../components/ui/Modal";
import { formatShortDate } from "../lib/dates";

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; task: Task };

export default function Tasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const canEdit = profile?.role === "admin";

  const load = async () => {
    try {
      const [rows, staffList] = await Promise.all([listAllTasks(), listStaff()]);
      setTasks(rows);
      setStaff(staffList);
      setError(null);
    } catch {
      setError("Could not load tasks. Try refreshing.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (input: TaskInput) => {
    if (!profile?.firm_id) throw new Error("no firm_id");
    await createTask(input, profile.firm_id);
    setMode({ kind: "list" });
    await load();
  };

  const handleEdit = async (input: TaskInput, id: string) => {
    await updateTask(id, input);
    setMode({ kind: "list" });
    await load();
  };

  const handleToggle = async (t: Task) => {
    setBusyId(t.id);
    try {
      await toggleTask(t.id, !t.is_complete);
      await load();
    } catch {
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteTask(id);
      setConfirmingDeleteId(null);
      await load();
    } catch {
      setBusyId(null);
      setConfirmingDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  const staffName = (id: string | null) =>
    id ? staff?.find((s) => s.id === id)?.full_name : null;

  const closeModal = () => setMode({ kind: "list" });

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            Firm
          </p>
          <h1 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-ink">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            What the firm still has to do.
          </p>
        </div>

        {canEdit && mode.kind === "list" && (
          <button
            type="button"
            onClick={() => setMode({ kind: "create" })}
            className="btn-primary"
          >
            Add task
          </button>
        )}
      </header>

      {error && (
        <p className="text-sm text-ink mb-4" role="alert">{error}</p>
      )}

      {tasks === null && !error && (
        <p className="text-sm text-ink-muted">Loading…</p>
      )}

      {tasks !== null && tasks.length === 0 && (
        <div className="border border-rule rounded-sm p-8 text-center">
          <p className="text-sm text-ink-muted">
            No tasks yet.
            {canEdit ? " Add the first one." : ""}
          </p>
        </div>
      )}

      {tasks !== null && tasks.length > 0 && (
        <ul className="border border-rule rounded-sm divide-y divide-rule bg-paper">
          {tasks.map((t) => (
            <li key={t.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => canEdit && handleToggle(t)}
                  disabled={!canEdit || busyId === t.id}
                  aria-label={
                    t.is_complete ? "Mark as incomplete" : "Mark as complete"
                  }
                  className={`mt-1 inline-block w-4 h-4 border rounded-sm flex-shrink-0 transition-colors
                    ${t.is_complete ? "bg-ink border-ink" : "bg-transparent border-rule"}
                    ${canEdit ? "hover:border-ink cursor-pointer" : "cursor-default"}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      t.is_complete ? "text-ink-muted line-through" : "text-ink"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t.due_date ? `Due ${formatShortDate(t.due_date)}` : "No due date"}
                    {staffName(t.staff_id) ? ` · ${staffName(t.staff_id)}` : ""}
                  </p>
                </div>

                {canEdit && mode.kind === "list" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {confirmingDeleteId === t.id ? (
                      <>
                        <span className="text-xs text-ink-muted">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={busyId === t.id}
                          className="btn-quiet"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          disabled={busyId === t.id}
                          className="btn-quiet"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setMode({ kind: "edit", task: t })}
                          className="btn-quiet"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(t.id)}
                          className="btn-quiet"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={mode.kind !== "list"}
        onClose={closeModal}
        title={mode.kind === "create" ? "New task" : "Edit task"}
      >
        {staff && mode.kind !== "list" && (
          <TaskForm
            staff={staff}
            initial={mode.kind === "edit" ? mode.task : null}
            onSubmit={
              mode.kind === "edit"
                ? (input) => handleEdit(input, mode.task.id)
                : handleCreate
            }
            onCancel={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}