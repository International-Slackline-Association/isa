import { format } from 'date-fns';

export const maxRigDays = 14;
const day = 24 * 3600;

const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 0, 0);
  return Math.floor(end.getTime() / 1000);
};
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return endOfDay(date);
};

export const untilPresets = () => {
  const daysToSunday = (7 - new Date().getDay()) % 7;
  const presets = [
    { label: 'Today', until: inDays(0) },
    { label: 'Tomorrow', until: inDays(1) },
    ...(daysToSunday > 1 ? [{ label: 'Sunday', until: inDays(daysToSunday) }] : []),
    { label: '1 week', until: inDays(7) },
  ];
  return presets;
};

export const untilFromDateInput = (value: string) => endOfDay(new Date(`${value}T00:00`));
export const dateInputBounds = () => ({
  min: format(new Date(), 'yyyy-MM-dd'),
  max: format(new Date(Date.now() + (maxRigDays - 1) * day * 1000), 'yyyy-MM-dd'),
});

export const formatUntil = (until: number) => {
  const date = new Date(until * 1000);
  const days = Math.round((endOfDay(date) - endOfDay(new Date())) / day);
  const time = format(date, 'HH:mm');
  if (days === 0) return `today, ${time}`;
  if (days === 1) return `tomorrow, ${time}`;
  return `${format(date, 'EEE d MMM')}, ${time}`;
};

export const formatReportedAgo = (reportedAt: number) => {
  const hours = Math.floor((Date.now() / 1000 - reportedAt) / 3600);
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
    'PRODID:-//SlackMap//Rig reminder//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@slackmap`,
    `DTSTAMP:${stamp(Math.floor(Date.now() / 1000))}`,
    `DTSTART:${stamp(remindAt)}`,
    `DTEND:${stamp(remindAt + 900)}`,
    `SUMMARY:${escape(`${lineName} rig expires ${formatUntil(until)}`)}`,
    `DESCRIPTION:${escape(`Still up? Extend it, or mark it taken down: ${manageLink}`)}`,
    `URL:${manageLink}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Blob([ics], { type: 'text/calendar' });
};
