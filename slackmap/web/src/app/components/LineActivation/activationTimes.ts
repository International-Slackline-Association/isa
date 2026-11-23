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
export const dateInputBounds = (from?: number) => {
  const base = from ? new Date(from * 1000) : new Date();
  return {
    min: format(base, 'yyyy-MM-dd'),
    max: format(addDays(base, maxActivationDays - 1), 'yyyy-MM-dd'),
  };
};
export const startInputBounds = () => ({
  min: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  max: format(addDays(new Date(), maxActivationDays), 'yyyy-MM-dd'),
});

export const formatDay = (seconds: number) => {
  const days = Math.round((startOfDay(new Date(seconds * 1000)) - startOfDay(new Date())) / day);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return format(new Date(seconds * 1000), 'EEE d MMM');
};

export const formatUntil = (until: number) => {
  const date = new Date(until * 1000);
  const days = Math.round((endOfDay(date) - endOfDay(new Date())) / day);
  const time = format(date, 'HH:mm');
  if (days === 0) return `today, ${time}`;
  if (days === 1) return `tomorrow, ${time}`;
  return `${format(date, 'EEE d MMM')}, ${time}`;
};

export const formatActivatedAgo = (activatedAt: number) => {
  const hours = Math.floor((Date.now() / 1000 - activatedAt) / 3600);
  if (hours < 1) return 'within the last hour';
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
};

export const expiresWithinADay = (until: number) => until - Date.now() / 1000 < day;

export const calendarFile = (lineName: string, until: number, manageLink: string) => {
  const remindAt = Math.max(until - day, Math.floor(Date.now() / 1000) + 3600);
  const stamp = (seconds: number) =>
    new Date(seconds * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (text: string) => text.replace(/[\\;,]/g, (c) => `\\${c}`);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SlackMap//Activation reminder//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@slackmap`,
    `DTSTAMP:${stamp(Math.floor(Date.now() / 1000))}`,
    `DTSTART:${stamp(remindAt)}`,
    `DTEND:${stamp(remindAt + 900)}`,
    `SUMMARY:${escape(`${lineName} activation ends ${formatUntil(until)}`)}`,
    `DESCRIPTION:${escape(`Still up? Extend it, or deactivate it: ${manageLink}`)}`,
    `URL:${manageLink}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Blob([ics], { type: 'text/calendar' });
};
