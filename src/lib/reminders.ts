/**
 * Pure reminder logic (no Ionic/DOM imports) so it can be unit-tested.
 * Dates are epoch milliseconds; day boundaries use the device's local time.
 */

export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  id: string;
  title: string;
  due: number;
  repeat: Repeat;
  done: boolean;
}

export interface ReminderGroups {
  overdue: Reminder[];
  today: Reminder[];
  upcoming: Reminder[];
  done: Reminder[];
}

export const REPEATS: readonly Repeat[] = ['none', 'daily', 'weekly', 'monthly'];

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Next due time for a repeating reminder; months clamp to the last day (Jan 31 -> Feb 28/29). */
export function nextOccurrence(due: number, repeat: Repeat): number {
  const d = new Date(due);
  switch (repeat) {
    case 'none':
      return due;
    case 'daily':
      d.setDate(d.getDate() + 1);
      return d.getTime();
    case 'weekly':
      d.setDate(d.getDate() + 7);
      return d.getTime();
    case 'monthly': {
      const day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, lastDay));
      return d.getTime();
    }
  }
}

/**
 * Completing a repeating reminder rolls it forward to the first occurrence
 * after `now` instead of marking it done.
 */
export function complete(reminder: Reminder, now: number): Reminder {
  if (reminder.repeat === 'none') return { ...reminder, done: true };
  let due = nextOccurrence(reminder.due, reminder.repeat);
  while (due <= now) due = nextOccurrence(due, reminder.repeat);
  return { ...reminder, due, done: false };
}

export function groupReminders(reminders: Reminder[], now: number): ReminderGroups {
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(todayStart + 36 * 3_600_000);
  const groups: ReminderGroups = { overdue: [], today: [], upcoming: [], done: [] };
  for (const r of [...reminders].sort((a, b) => a.due - b.due)) {
    if (r.done) groups.done.push(r);
    else if (r.due < now) groups.overdue.push(r);
    else if (r.due < tomorrowStart) groups.today.push(r);
    else groups.upcoming.push(r);
  }
  return groups;
}

const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today 09:30", "Tomorrow 18:00", "Yesterday 08:00" or "Mon 3 Jun 09:30". */
export function formatDue(due: number, now: number): string {
  const d = new Date(due);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayDiff = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000);
  if (dayDiff === 0) return `Today ${time}`;
  if (dayDiff === 1) return `Tomorrow ${time}`;
  if (dayDiff === -1) return `Yesterday ${time}`;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${time}`;
}

/** Value for `<input type="datetime-local">` in local time. */
export function toLocalInput(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function validateReminder(title: string, due: number): string | null {
  if (!title.trim()) return 'Title is required.';
  if (title.trim().length > 120) return 'Title must be at most 120 characters.';
  if (!Number.isFinite(due)) return 'Pick a valid date and time.';
  return null;
}

/** Parses stored JSON defensively; drops malformed entries instead of crashing. */
export function parseReminders(json: string | null): Reminder[] {
  if (!json) return [];
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (r): r is Reminder =>
        typeof r === 'object' &&
        r !== null &&
        typeof r.id === 'string' &&
        typeof r.title === 'string' &&
        typeof r.due === 'number' &&
        typeof r.done === 'boolean' &&
        REPEATS.includes(r.repeat),
    );
  } catch {
    return [];
  }
}
