import { supabase } from "../supabase";

export type EventKind = "consultation" | "deposition" | "appearance";

export type BriefEvent = {
  id: string;
  firm_id: string;
  staff_id: string;
  room_id: string;
  kind: EventKind;
  start_at: string; // ISO timestamp
  end_at: string;   // ISO timestamp
  client_name: string | null;
  matter_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EventInput = {
  staff_id: string;
  room_id: string;
  kind: EventKind;
  start_at: string; // ISO
  end_at: string;   // ISO
  client_name: string | null;
  matter_ref: string | null;
  notes: string | null;
};

/**
 * Typed error for EXCLUDE-constraint violations. The database is the
 * only source of truth on conflicts; when it refuses a row, the UI
 * needs to know that this is a conflict and not a generic failure.
 */
export class ConflictError extends Error {
  constructor() {
    super("That time is already booked.");
    this.name = "ConflictError";
  }
}

const SELECT_COLUMNS =
  "id, firm_id, staff_id, room_id, kind, start_at, end_at, client_name, matter_ref, notes, created_at, updated_at";

/** Throws ConflictError on 23P01, rethrows everything else. */
function handleError(error: { code?: string; message?: string }): never {
  if (error.code === "23P01") {
    throw new ConflictError();
  }
  throw error;
}

/**
 * Reads events for the caller's firm within a date range, inclusive of
 * start and exclusive of end. Used by the calendar page and the
 * dashboard's "this week" widget.
 */
export async function listEventsInRange(
  fromIso: string,
  toIso: string
): Promise<BriefEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select(SELECT_COLUMNS)
    .gte("start_at", fromIso)
    .lt("start_at", toIso)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BriefEvent[];
}

/**
 * Reads the next N events from now, ordered by start. Used by the
 * dashboard's "upcoming" widget.
 */
export async function listUpcomingEvents(limit = 4): Promise<BriefEvent[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .select(SELECT_COLUMNS)
    .gte("start_at", nowIso)
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as BriefEvent[];
}

export async function createEvent(input: EventInput): Promise<BriefEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...input,
      client_name: input.client_name?.trim() || null,
      matter_ref: input.matter_ref?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) handleError(error);
  return data as BriefEvent;
}

export async function updateEvent(
  id: string,
  input: EventInput
): Promise<BriefEvent> {
  const { data, error } = await supabase
    .from("events")
    .update({
      ...input,
      client_name: input.client_name?.trim() || null,
      matter_ref: input.matter_ref?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) handleError(error);
  return data as BriefEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}