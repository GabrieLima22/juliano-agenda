import { eachDayOfInterval, format } from "date-fns";
import { Meeting, RecurrenceType } from "@/types/meeting";
import { parseLocalDate } from "@/lib/utils";

const WEEKDAY_ORDER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;
const WEEKDAY_PRIORITY = new Map(WEEKDAY_ORDER.map((day, index) => [day, index]));

const canonicalizeWeekday = (day: string) => {
  const trimmed = day.trim();

  if (trimmed === "SÃ¡b" || trimmed === "Sábado") {
    return "Sab";
  }

  return trimmed;
};

const normalizeWeekdays = (days: string[] | null | undefined): string[] => {
  if (!Array.isArray(days)) {
    return [];
  }

  return [...new Set(days)]
    .map(canonicalizeWeekday)
    .filter((day) => WEEKDAY_PRIORITY.has(day))
    .sort((a, b) => (WEEKDAY_PRIORITY.get(a) ?? 99) - (WEEKDAY_PRIORITY.get(b) ?? 99));
};

const resolveMonthlyDay = (meeting: Pick<Meeting, "date" | "recurrenceDayOfMonth">) => {
  if (typeof meeting.recurrenceDayOfMonth === "number" && meeting.recurrenceDayOfMonth >= 1) {
    return meeting.recurrenceDayOfMonth;
  }

  return parseLocalDate(meeting.date).getDate();
};

const weekdayToNumber = (day: string) => {
  switch (canonicalizeWeekday(day)) {
    case "Dom":
      return 0;
    case "Seg":
      return 1;
    case "Ter":
      return 2;
    case "Qua":
      return 3;
    case "Qui":
      return 4;
    case "Sex":
      return 5;
    case "Sab":
      return 6;
    default:
      return null;
  }
};

const toDateKey = (value: Date | string) =>
  typeof value === "string" ? value : format(value, "yyyy-MM-dd");

const compareMeetingTime = (a: Pick<Meeting, "time" | "title">, b: Pick<Meeting, "time" | "title">) => {
  const timeComparison = (a.time ?? "").localeCompare(b.time ?? "");
  if (timeComparison !== 0) {
    return timeComparison;
  }

  return (a.title ?? "").localeCompare(b.title ?? "");
};

interface RecurringMeetingShape {
  date: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceDaysOfWeek?: string[] | null;
}

interface MeetingCollectionFilter {
  approvedOnly?: boolean;
  includePending?: boolean;
  includeRejected?: boolean;
}

const matchesStatus = (meeting: Pick<Meeting, "status">, filter: MeetingCollectionFilter) => {
  if (filter.approvedOnly) {
    return meeting.status === "approved";
  }

  if (meeting.status === "approved") {
    return true;
  }

  if (meeting.status === "pending") {
    return Boolean(filter.includePending);
  }

  return Boolean(filter.includeRejected);
};

export const meetingOccursOnDate = (
  meeting: RecurringMeetingShape,
  targetDate: Date | string,
) => {
  const dateKey = toDateKey(targetDate);

  if (!meeting.isRecurring) {
    return meeting.date === dateKey;
  }

  if (dateKey < meeting.date) {
    return false;
  }

  if (meeting.recurrenceType === "weekly") {
    const days = normalizeWeekdays(meeting.recurrenceDaysOfWeek);
    if (days.length === 0) {
      return false;
    }

    const targetWeekday = parseLocalDate(dateKey).getDay();
    return days.some((day) => weekdayToNumber(day) === targetWeekday);
  }

  if (meeting.recurrenceType === "daily") {
    return parseLocalDate(dateKey).getDate() === resolveMonthlyDay(meeting);
  }

  return meeting.date === dateKey;
};

export const getMeetingsOccurringOnDate = (
  meetings: Meeting[],
  targetDate: Date | string,
  filter: MeetingCollectionFilter = {},
) =>
  meetings
    .filter((meeting) => matchesStatus(meeting, filter) && meetingOccursOnDate(meeting, targetDate))
    .sort(compareMeetingTime);

export const getMeetingCountMapForInterval = (
  meetings: Meeting[],
  start: Date,
  end: Date,
  filter: MeetingCollectionFilter = {},
) => {
  const counts = new Map<string, number>();

  eachDayOfInterval({ start, end }).forEach((day) => {
    const dateKey = toDateKey(day);
    counts.set(dateKey, getMeetingsOccurringOnDate(meetings, dateKey, filter).length);
  });

  return counts;
};

export const getRecurrenceFrequencyLabel = (recurrenceType?: RecurrenceType | null) => {
  if (recurrenceType === "weekly") {
    return "Semanal";
  }

  if (recurrenceType === "daily") {
    return "Mensal";
  }

  return "Recorrente";
};

export const getRecurrenceSummary = (
  meeting: Pick<Meeting, "date" | "isRecurring" | "recurrenceType" | "recurrenceDayOfMonth" | "recurrenceDaysOfWeek">,
) => {
  if (!meeting.isRecurring) {
    return null;
  }

  if (meeting.recurrenceType === "weekly") {
    const days = normalizeWeekdays(meeting.recurrenceDaysOfWeek);
    if (days.length > 0) {
      return `Toda semana em ${days.join(", ")}`;
    }

    return "Repeticao semanal";
  }

  if (meeting.recurrenceType === "daily") {
    return `Todo mes no dia ${resolveMonthlyDay(meeting)}`;
  }

  return "Reuniao recorrente";
};

export const getRecurrenceDetails = (
  meeting: Pick<Meeting, "date" | "isRecurring" | "recurrenceType" | "recurrenceDayOfMonth" | "recurrenceDaysOfWeek">,
) => {
  if (!meeting.isRecurring) {
    return [];
  }

  return [
    {
      label: "Inicio",
      value: format(parseLocalDate(meeting.date), "dd/MM/yyyy"),
    },
    {
      label: "Frequencia",
      value: getRecurrenceFrequencyLabel(meeting.recurrenceType),
    },
    {
      label: "Repeticao",
      value: getRecurrenceSummary(meeting) ?? "Reuniao recorrente",
    },
  ];
};
