/**
 * Date helpers for the calendar. All times are wall-clock in the
 * browser's local timezone. South Africa has no DST, so this is safe
 * for the pilot. A firm timezone column is a later addition.
 *
 * Week starts Monday.
 */

/** Returns YYYY-MM-DD in local time. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns the Monday at 00:00 local of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

/** Adds N days to a date, returns a new date. */
export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Formats a date as "HH:MM" in local time. */
export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Formats a date as "Mon 03 Nov" (short). */
export function formatShortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/**
 * Builds an ISO string from a date input ("YYYY-MM-DD") and a time
 * input ("HH:MM"), interpreted as local wall-clock. Returns the UTC
 * ISO that timestamptz will store.
 */
export function combineDateAndTime(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return local.toISOString();
}

/** Extracts "YYYY-MM-DD" from an ISO timestamp, in local time. */
export function isoToDateInput(iso: string): string {
  return toDateKey(new Date(iso));
}

/** Extracts "HH:MM" from an ISO timestamp, in local time. */
export function isoToTimeInput(iso: string): string {
  return formatTime(new Date(iso));
}