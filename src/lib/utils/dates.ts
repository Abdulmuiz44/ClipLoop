export function getWeekStart(date = new Date()): Date {
  const value = new Date(date);
  const day = value.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setUTCDate(value.getUTCDate() + diff);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
