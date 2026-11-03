import { supabase } from "../supabase";

export type Task = {
  id: string;
  firm_id: string;
  staff_id: string | null;
  title: string;
  due_date: string | null; // "YYYY-MM-DD"
  is_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  staff_id: string | null;
  due_date: string | null;
};

const SELECT_COLUMNS =
  "id, firm_id, staff_id, title, due_date, is_complete, created_at, updated_at";

/**
 * All tasks for the caller's firm, ordered open-first (due date ascending
 * within open, then completed by updated_at descending). Used by /tasks.
 */
export async function listAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(SELECT_COLUMNS)
    .order("is_complete", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}

/**
 * Open tasks only, limited. Used by the dashboard widget.
 */
export async function listOpenTasks(limit = 5): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(SELECT_COLUMNS)
    .eq("is_complete", false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(
  input: TaskInput,
  firmId: string
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      firm_id: firmId,
      staff_id: input.staff_id,
      title: input.title.trim(),
      due_date: input.due_date || null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  input: TaskInput
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      staff_id: input.staff_id,
      title: input.title.trim(),
      due_date: input.due_date || null,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Task;
}

export async function toggleTask(id: string, isComplete: boolean): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_complete: isComplete })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}