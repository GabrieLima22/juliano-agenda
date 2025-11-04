export const formatDuration = (minutes: number): string => {
  const totalMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hourString = hours.toString().padStart(2, "0");
  const minuteString = mins.toString().padStart(2, "0");
  return `${hourString}:${minuteString}`;
};

export const parseDurationInput = (
  raw: string,
): { minutes: number; formatted: string } | null => {
  const sanitized = raw.trim();

  if (!sanitized) {
    return null;
  }

  if (/^\d+$/.test(sanitized)) {
    const minutes = Number(sanitized);
    if (Number.isNaN(minutes)) {
      return null;
    }
    return { minutes, formatted: formatDuration(minutes) };
  }

  const colonMatch = sanitized.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const hours = Number(colonMatch[1]);
    const mins = Number(colonMatch[2]);
    if (Number.isNaN(hours) || Number.isNaN(mins) || mins >= 60) {
      return null;
    }
    const totalMinutes = hours * 60 + mins;
    return { minutes: totalMinutes, formatted: formatDuration(totalMinutes) };
  }

  const hourMatch = sanitized.match(/^(\d+)[hH](\d{1,2})$/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    const mins = Number(hourMatch[2]);
    if (Number.isNaN(hours) || Number.isNaN(mins) || mins >= 60) {
      return null;
    }
    const totalMinutes = hours * 60 + mins;
    return { minutes: totalMinutes, formatted: formatDuration(totalMinutes) };
  }

  return null;
};

export const formatDurationHuman = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "00:00";
  }
  return formatDuration(minutes);
};

