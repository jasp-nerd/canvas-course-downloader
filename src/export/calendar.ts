// Deadlines as an iCalendar file (RFC 5545) that any calendar app imports.
// Each event keeps a stable UID, so importing a later export updates the
// events instead of adding them twice.

export interface CalendarEvent {
  /** Stable across exports, e.g. "courses-101-assignments-5@school.instructure.com". */
  uid: string;
  title: string;
  /** ISO date-time of the deadline. */
  start: string;
  url?: string;
  description?: string;
}

/** "2026-09-12T21:59:00Z" → "20260912T215900Z" (UTC). */
const icsDate = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** TEXT values: backslash, semicolon, comma and newlines are escaped (RFC 5545 3.3.11). */
const text = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 bytes continue on the next line after a space, never inside a character. */
function fold(line: string): string {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    // The first line holds 75 bytes; continuation lines lose one to the leading space.
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

export function renderIcs(input: { name: string; now: Date; events: CalendarEvent[] }): string {
  const stamp = icsDate(input.now);
  const events = input.events
    .map((e) => ({ ...e, date: new Date(e.start) }))
    .filter((e) => !Number.isNaN(e.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Course Downloader//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${text(input.name)}`,
  ];
  for (const e of events) {
    const at = icsDate(e.date);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      // A deadline is a moment: Canvas's own calendar feed gives it the same start and end.
      `DTSTART:${at}`,
      `DTEND:${at}`,
      `SUMMARY:${text(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${text(e.description)}`] : []),
      ...(e.url ? [`URL:${e.url}`] : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
