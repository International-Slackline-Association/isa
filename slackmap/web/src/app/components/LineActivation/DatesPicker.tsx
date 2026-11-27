import { useEffect, useState } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Box, ButtonBase, Chip, IconButton, Stack, Typography } from '@mui/material';

import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns';
import { ui } from 'styles/theme/ui';

import { ActivationDate } from './activationApi';

export const maxDatesAheadDays = 90;
export const maxDates = 30;

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');
const fromKey = (key: string) => new Date(`${key}T00:00`);
const today = () => fromKey(dayKey(new Date()));
const lastDay = () => addDays(today(), maxDatesAheadDays - 1);

const atHour = (day: Date, hour: number) => {
  const date = new Date(day);
  date.setHours(hour, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

// An end at or before the start is the next day: an evening session that runs past midnight.
const toDates = (days: string[], startHour: number, endHour: number): ActivationDate[] =>
  [...days].sort().map((key) => {
    const day = fromKey(key);
    return { from: atHour(day, startHour), until: atHour(endHour > startHour ? day : addDays(day, 1), endHour) };
  });

const repeats = [
  { label: 'Every week', weeks: 1 },
  { label: 'Every 2 weeks', weeks: 2 },
  { label: 'Every 4 weeks', weeks: 4 },
];
const repeatCount = 8;

const chipBoxSx = { display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, height: 32, borderRadius: 999, bgcolor: '#fff', color: 'text.secondary' };

const HourSelect = (props: { value: number; label: string; onPick: (hour: number) => void }) => (
  <Box component="label" sx={chipBoxSx}>
    <ScheduleIcon sx={{ fontSize: 16 }} />
    <Typography variant="caption">{props.label}</Typography>
    <Box
      component="select"
      value={props.value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onPick(Number(e.target.value))}
      sx={{ border: 0, font: 'inherit', fontSize: 13, color: 'text.primary', bgcolor: 'transparent' }}
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>
      ))}
    </Box>
  </Box>
);

export const DatesPicker = (props: { initial?: ActivationDate[]; onChange: (dates: ActivationDate[]) => void }) => {
  const first = props.initial?.[0];
  const [days, setDays] = useState<string[]>(() => (props.initial ?? []).map((d) => dayKey(new Date(d.from * 1000))));
  const [startHour, setStartHour] = useState(first ? new Date(first.from * 1000).getHours() : 18);
  const [endHour, setEndHour] = useState(first ? new Date(first.until * 1000).getHours() : 21);
  const [month, setMonth] = useState(() => startOfMonth(first ? new Date(first.from * 1000) : today()));

  useEffect(() => props.onChange(toDates(days, startHour, endHour)), [days, startHour, endHour]);

  // A day whose window has already ended today cannot be picked; the server refuses a date in the past.
  const ended = (key: string) => toDates([key], startHour, endHour)[0].until <= Date.now() / 1000;
  useEffect(() => setDays((current) => current.filter((key) => !ended(key))), [startHour, endHour]);

  const toggle = (key: string) =>
    setDays((current) => (current.includes(key) ? current.filter((d) => d !== key) : current.length < maxDates ? [...current, key] : current));

  const repeat = (weeks: number) => {
    const start = days.length ? fromKey([...days].sort()[0]) : today();
    const filled = Array.from({ length: repeatCount }, (_, i) => addDays(start, i * 7 * weeks))
      .filter((d) => d <= lastDay())
      .map(dayKey)
      .filter((key) => !ended(key));
    setDays([...new Set([...days, ...filled])].sort().slice(0, maxDates));
  };

  const gridStart = startOfWeek(month, { weekStartsOn: 1 });
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const canGoBack = month > startOfMonth(today());
  const canGoOn = addMonths(month, 1) <= lastDay();

  return (
    <Stack spacing={1}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <IconButton size="small" aria-label="Previous month" disabled={!canGoBack} onClick={() => setMonth(addMonths(month, -1))}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2Bold" sx={{ flex: 1, textAlign: 'center' }}>
          {format(month, 'MMMM yyyy')}
        </Typography>
        <IconButton size="small" aria-label="Next month" disabled={!canGoOn} onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <Typography key={d} variant="caption" color="text.secondary">
            {d}
          </Typography>
        ))}
        {cells.map((date) => {
          const key = dayKey(date);
          const inMonth = date.getMonth() === month.getMonth();
          const selectable = inMonth && date >= today() && date <= lastDay() && !ended(key);
          const selected = days.includes(key);
          return (
            <ButtonBase
              key={key}
              disabled={!selectable}
              onClick={() => toggle(key)}
              aria-pressed={selected}
              sx={{
                height: 34,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: selected ? 600 : 400,
                visibility: inMonth ? 'visible' : 'hidden',
                bgcolor: selected ? ui.active : '#fff',
                color: selected ? ui.onActive : selectable ? 'text.primary' : ui.muted,
                opacity: selectable ? 1 : 0.4,
                '&:hover': { bgcolor: selected ? ui.active : ui.fillHover },
              }}
            >
              {date.getDate()}
            </ButtonBase>
          );
        })}
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
        {repeats.map((r) => (
          <Chip key={r.label} label={r.label} onClick={() => repeat(r.weeks)} sx={{ fontWeight: 600, bgcolor: '#fff' }} />
        ))}
      </Stack>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
        <HourSelect label="from" value={startHour} onPick={setStartHour} />
        <HourSelect label={endHour > startHour ? 'until' : 'until, next day'} value={endHour} onPick={setEndHour} />
      </Stack>
    </Stack>
  );
};
