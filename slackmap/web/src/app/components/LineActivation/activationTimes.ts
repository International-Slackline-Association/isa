import { format } from 'date-fns';

export const maxActivationDays = 14;
const day = 24 * 3600;

const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 0, 0);
  return Math.floor(end.getTime() / 1000);
};
const startOfDay = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return Math.floor(start.getTime() / 1000);
};
const addDays = (base: Date, days: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
};
const daysToSaturday = () => (6 - new Date().getDay() + 7) % 7;

export const startPresets = () => [
  { label: 'Now', from: undefined },
  { label: 'Tomorrow', from: startOfDay(addDays(new Date(), 1)) },
  ...(daysToSaturday() > 1 ? [{ label: 'Saturday', from: startOfDay(addDays(new Date(), daysToSaturday())) }] : []),
];

export const untilPresets = (from?: number) => {
  const base = from ? new Date(from * 1000) : new Date();
  if (from) {
    return [
      { label: 'Same day', until: endOfDay(base) },
      { label: 'Next day', until: endOfDay(addDays(base, 1)) },
      { label: '1 week', until: endOfDay(addDays(base, 6)) },
    ];
  }
  const daysToSunday = (7 - base.getDay()) % 7;
  return [
    { label: 'Today', until: endOfDay(base) },
    { label: 'Tomorrow', until: endOfDay(addDays(base, 1)) },
    ...(daysToSunday > 1 ? [{ label: 'Sunday', until: endOfDay(addDays(base, daysToSunday)) }] : []),
    { label: '1 week', until: endOfDay(addDays(base, 7)) },
  ];
};

export const startFromDateInput = (value: string) => startOfDay(new Date(`${value}T00:00`));
export const untilFromDateInput = (value: string) => endOfDay(new Date(`${value}T00:00`));
export const dateInputBounds = (from?: number, after?: number) => {
  const base = from ? new Date(from * 1000) : new Date();
  // An extension offers only days ending after the current end.
  const firstDay = after ? new Date((after + 60) * 1000) : base;
  return {
    min: format(firstDay, 'yyyy-MM-dd'),
    max: format(addDays(base, maxActivationDays - 1), 'yyyy-MM-dd'),
  };
};
export const startInputBounds = () => ({
  min: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  max: format(addDays(new Date(), maxActivationDays), 'yyyy-MM-dd'),
});

// A day without a chosen hour starts at 00:00 and ends at 23:59; any other time is a chosen whole hour.
export type Bound = 'start' | 'end';
const dayDefault = (date: Date, bound: Bound) => (bound === 'start' ? startOfDay(date) : endOfDay(date));

export const hourOf = (seconds: number, bound: Bound) => {
  const date = new Date(seconds * 1000);
  return seconds === dayDefault(date, bound) ? undefined : date.getHours();
};

export const atHour = (seconds: number, bound: Bound, hour?: number) => {
  const date = new Date(seconds * 1000);
  if (hour === undefined) return dayDefault(date, bound);
  date.setHours(hour, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

export const sameDay = (a?: number, b?: number) =>
  a === b || (a !== undefined && b !== undefined && new Date(a * 1000).toDateString() === new Date(b * 1000).toDateString());

const formatMoment = (seconds: number, bound: Bound) => {
  const date = new Date(seconds * 1000);
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / day);
  const dayText = days === 0 ? 'today' : days === 1 ? 'tomorrow' : format(date, 'EEE d MMM');
  return hourOf(seconds, bound) === undefined ? dayText : `${dayText}, ${format(date, 'HH:mm')}`;
};
export const formatStart = (from: number) => formatMoment(from, 'start');
export const formatUntil = (until: number) => formatMoment(until, 'end');

export const formatActivatedAgo = (activatedAt: number) => {
  const hours = Math.floor((Date.now() / 1000 - activatedAt) / 3600);
  if (hours < 1) return 'within the last hour';
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
};

// A short activation gets no "still up?" nudge; it would show from the start.
export const nudgeToExtend = (from: number, until: number) => until - from >= day && until - Date.now() / 1000 < day;
