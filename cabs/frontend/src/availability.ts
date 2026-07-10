/**
 * availability.ts
 * Pure utility — no React, no side effects.
 * Used by calendar and ride-create screens to compute booking overlaps.
 */
import type { Booking } from "./api";

export const BLOCKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Available",
  "Ride in Progress",
];

/** Returns every calendar date-key (YYYY-MM-DD) that a booking spans. */
export function getBookingDateKeys(booking: Booking): string[] {
  if (!booking.pickupD || !booking.dropD) return [];
  const start = new Date(booking.pickupD);
  const end = new Date(booking.dropD);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  const keys: string[] = [];
  const cur = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cur <= last) {
    keys.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

/** Map from dateKey → list of bookings that overlap that day. */
export function buildBookingMap(
  bookings: Booking[]
): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>();
  for (const b of bookings) {
    for (const key of getBookingDateKeys(b)) {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
  }
  return map;
}

export type DayStatus = "free" | "partial" | "busy" | "history";

/**
 * Classify a calendar day:
 * "busy"    — a Private or fully-booked ride is active that day
 * "partial" — a Shared ride has seats taken but more may be available
 * "history" — only Completed/Cancelled bookings (no active ride)
 * "free"    — no bookings at all
 */
export function getDayStatus(
  key: string,
  map: Map<string, Booking[]>
): DayStatus {
  const list = map.get(key) ?? [];
  if (list.length === 0) return "free";

  const active = list.filter((b) =>
    BLOCKING_STATUSES.includes(b.bookingStatus ?? "")
  );
  if (active.length === 0) return "history";

  const hasPrivate = active.some((b) => b.sharingType === "Private");
  return hasPrivate ? "busy" : "partial";
}

/** Returns bookings that conflict (time-overlap, non-terminal status) with [start, end]. */
export function findConflicts(
  start: Date,
  end: Date,
  bookings: Booking[]
): Booking[] {
  return bookings.filter((b) => {
    if (!b.pickupD || !b.dropD) return false;
    if (["Completed", "Cancelled", "Failed"].includes(b.bookingStatus ?? ""))
      return false;
    const bStart = new Date(b.pickupD);
    const bEnd = new Date(b.dropD);
    return start < bEnd && end > bStart;
  });
}

/** YYYY-MM-DD string from a Date */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Human-readable date range (e.g. "10 Jul – 12 Jul") */
export function formatRange(pickupD?: string, dropD?: string): string {
  if (!pickupD && !dropD) return "—";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  if (pickupD && dropD) return `${fmt(pickupD)} – ${fmt(dropD)}`;
  return fmt(pickupD ?? dropD ?? "");
}
