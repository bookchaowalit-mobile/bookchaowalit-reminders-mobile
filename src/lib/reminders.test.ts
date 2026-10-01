import { describe, expect, it } from 'vitest';
import {
  type Reminder,
  complete,
  formatDue,
  groupReminders,
  nextOccurrence,
  parseReminders,
  toLocalInput,
  validateReminder,
} from './reminders';

const at = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const r = (id: string, due: number, over: Partial<Reminder> = {}): Reminder => ({
  id,
  title: id,
  due,
  repeat: 'none',
  done: false,
  ...over,
});

describe('nextOccurrence', () => {
  it('advances daily and weekly', () => {
    expect(nextOccurrence(at(2026, 3, 10), 'daily')).toBe(at(2026, 3, 11));
    expect(nextOccurrence(at(2026, 3, 10), 'weekly')).toBe(at(2026, 3, 17));
    expect(nextOccurrence(at(2026, 3, 10), 'none')).toBe(at(2026, 3, 10));
  });

  it('clamps monthly repeats to the end of shorter months', () => {
    expect(nextOccurrence(at(2026, 1, 31), 'monthly')).toBe(at(2026, 2, 28));
    expect(nextOccurrence(at(2028, 1, 31), 'monthly')).toBe(at(2028, 2, 29));
    expect(nextOccurrence(at(2026, 12, 15), 'monthly')).toBe(at(2027, 1, 15));
  });
});

describe('complete', () => {
  it('marks one-off reminders done', () => {
    expect(complete(r('a', at(2026, 3, 10)), at(2026, 3, 10, 12)).done).toBe(true);
  });

  it('rolls repeating reminders past now', () => {
    const done = complete(r('a', at(2026, 3, 1), { repeat: 'daily' }), at(2026, 3, 10, 12));
    expect(done).toMatchObject({ done: false, due: at(2026, 3, 11) });
  });
});

describe('groupReminders', () => {
  it('buckets by overdue / today / upcoming / done', () => {
    const now = at(2026, 3, 10, 12);
    const g = groupReminders(
      [
        r('later', at(2026, 3, 12)),
        r('late', at(2026, 3, 10, 8)),
        r('tonight', at(2026, 3, 10, 20)),
        r('finished', at(2026, 3, 1), { done: true }),
        r('tomorrow', at(2026, 3, 11, 0, 0)),
      ],
      now,
    );
    expect(g.overdue.map((x) => x.id)).toEqual(['late']);
    expect(g.today.map((x) => x.id)).toEqual(['tonight']);
    expect(g.upcoming.map((x) => x.id)).toEqual(['tomorrow', 'later']);
    expect(g.done.map((x) => x.id)).toEqual(['finished']);
  });
});

describe('formatting', () => {
  const now = at(2026, 6, 3, 12); // Wed 3 Jun 2026
  it('uses relative day names nearby', () => {
    expect(formatDue(at(2026, 6, 3, 9, 30), now)).toBe('Today 09:30');
    expect(formatDue(at(2026, 6, 4, 18), now)).toBe('Tomorrow 18:00');
    expect(formatDue(at(2026, 6, 2, 8), now)).toBe('Yesterday 08:00');
    expect(formatDue(at(2026, 6, 8, 7, 5), now)).toBe('Mon 8 Jun 07:05');
  });

  it('builds datetime-local values', () => {
    expect(toLocalInput(at(2026, 6, 3, 7, 5))).toBe('2026-06-03T07:05');
  });
});

describe('validation and parsing', () => {
  it('validates input', () => {
    expect(validateReminder('  ', at(2026, 1, 1))).toMatch(/required/);
    expect(validateReminder('Pay rent', Number.NaN)).toMatch(/valid/);
    expect(validateReminder('Pay rent', at(2026, 1, 1))).toBeNull();
  });

  it('parses stored data defensively', () => {
    expect(parseReminders(null)).toEqual([]);
    expect(parseReminders('not json')).toEqual([]);
    expect(parseReminders('{"a":1}')).toEqual([]);
    const good = r('a', 1);
    expect(parseReminders(JSON.stringify([good, { id: 2 }, { ...good, repeat: 'hourly' }]))).toEqual([good]);
  });
});

describe('pass 3 edge cases', () => {
  it('a monthly reminder on the 31st does not drift to the 28th after February', () => {
    let rem: Reminder = { id: '1', title: 'Rent', due: at(2026, 1, 31), repeat: 'monthly', done: false };
    rem = complete(rem, at(2026, 2, 1)); // -> Feb 28
    expect(new Date(rem.due).getDate()).toBe(28);
    rem = complete(rem, at(2026, 3, 1)); // -> Mar 31, not Mar 28
    expect(new Date(rem.due).getMonth()).toBe(2);
    expect(new Date(rem.due).getDate()).toBe(31);
    rem = complete(rem, at(2026, 4, 1)); // -> Apr 30
    expect(new Date(rem.due).getDate()).toBe(30);
  });
  it('keeps wall-clock time across a DST change for daily repeats', () => {
    // Meaningful in zones with DST (verified with TZ=Europe/Berlin); passes trivially in UTC.
    const due = new Date(2026, 2, 28, 9, 30).getTime(); // day before EU DST starts
    const next = new Date(nextOccurrence(due, 'daily'));
    expect([next.getDate(), next.getHours(), next.getMinutes()]).toEqual([29, 9, 30]);
  });
  it('rejects a stored dayOfMonth outside 1–31', () => {
    const base = { id: '1', title: 't', due: 0, repeat: 'monthly', done: false };
    expect(parseReminders(JSON.stringify([{ ...base, dayOfMonth: 40 }]))).toEqual([]);
    expect(parseReminders(JSON.stringify([{ ...base, dayOfMonth: 31 }]))).toHaveLength(1);
  });
  it('rejects a title made only of zero-width characters', () => {
    expect(validateReminder('\u200B\u200D ', at(2026, 1, 1))).toBe('Title is required.');
  });
  it('counts an emoji title by character, not UTF-16 unit', () => {
    expect(validateReminder('🔔'.repeat(120), at(2026, 1, 1))).toBeNull();
    expect(validateReminder('🔔'.repeat(121), at(2026, 1, 1))).toBe('Title must be at most 120 characters.');
  });
});
