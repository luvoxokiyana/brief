import { supabase } from "../supabase";

export type AvailabilityWindow = {
  id: string;
  firm_id: string;
  staff_id: string;
  weekday: number; // 0 = Sunday, 6 = Saturday (JS Date.getDay)
  start_time: string; // "09:00:00"
  end_time: string;   // "17:00:00"
  is_recurring: boolean;
};

export type AvailabilityInput = {
  weekday: number;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
};

/** Reads all availability windows for a given staff member. */
export async function listAvailability(
  staffId: string
): Promise<AvailabilityWindow[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("id, firm_id, staff_id, weekday, start_time, end_time, is_recurring")
    .eq("staff_id", staffId)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AvailabilityWindow[];
}

/**
 * Applies a full new set of windows for a staff member by diffing
 * against what exists.
 *
 * @param staffId   the staff member
 * @param firmId    the caller's firm (from profile)
 * @param existing  the current rows, from listAvailability()
 * @param next      the user's edited list (each with an id if it came from
 *                  `existing`, or no id if it's new)
 *
 * Behavior:
 *   - Windows in `next` that have an `id` are matched to `existing` by id.
 *     If weekday / start / end are unchanged, no-op. If changed, UPDATE.
 *   - Windows in `next` without an `id` are INSERTed.
 *   - Windows in `existing` not present in `next` (by id) are DELETEd.
 *
 * All operations are performed sequentially, stopping at the first
 * error. A partial failure leaves the DB in a consistent partial state:
 * some operations applied, some not. The caller is expected to show
 * an error and let the user retry; re-running the diff is safe.
 */
export async function saveAvailability(
  staffId: string,
  firmId: string,
  existing: AvailabilityWindow[],
  next: Array<AvailabilityInput & { id?: string }>
): Promise<void> {
  const existingById = new Map(existing.map((w) => [w.id, w]));

  // Normalize time strings to "HH:MM:SS" for comparison against the DB.
  const normalizeTime = (t: string) => {
    // Accepts "HH:MM" or "HH:MM:SS"; returns "HH:MM:SS".
    const parts = t.split(":");
    const hh = parts[0]?.padStart(2, "0") ?? "00";
    const mm = parts[1]?.padStart(2, "0") ?? "00";
    const ss = parts[2]?.padStart(2, "0") ?? "00";
    return `${hh}:${mm}:${ss}`;
  };

  const nextIds = new Set<string>();

  for (const w of next) {
    const start = normalizeTime(w.start_time);
    const end = normalizeTime(w.end_time);

    if (w.id && existingById.has(w.id)) {
      nextIds.add(w.id);
      const prev = existingById.get(w.id)!;
      if (
        prev.weekday !== w.weekday ||
        normalizeTime(prev.start_time) !== start ||
        normalizeTime(prev.end_time) !== end
      ) {
        const { error } = await supabase
          .from("availability")
          .update({
            weekday: w.weekday,
            start_time: start,
            end_time: end,
          })
          .eq("id", w.id);
        if (error) throw error;
      }
    } else {
      // New window — insert
      const { error } = await supabase.from("availability").insert({
        firm_id: firmId,
        staff_id: staffId,
        weekday: w.weekday,
        start_time: start,
        end_time: end,
        is_recurring: true,
      });
      if (error) throw error;
    }
  }

  // Delete windows that are in `existing` but not in `next`.
  const toDelete = existing.filter((w) => !nextIds.has(w.id));
  for (const w of toDelete) {
    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("id", w.id);
    if (error) throw error;
  }
}