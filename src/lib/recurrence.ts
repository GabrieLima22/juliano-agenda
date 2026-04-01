import { addDays, eachDayOfInterval, format } from "date-fns";
import { Meeting, MonthlyRecurrenceRule, MonthlyRecurrenceWeek, RecurrenceType } from "@/types/meeting";
import { parseLocalDate } from "@/lib/utils";

const WEEKDAY_ORDER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;
type WeekdayKey = (typeof WEEKDAY_ORDER)[number];

export const RECURRENCE_WEEKDAYS = [...WEEKDAY_ORDER];
export const MONTHLY_RECURRENCE_WEEKS = [1, 2, 3, 4, 5, -1] as const;

const WEEKDAY_PRIORITY = new Map(WEEKDAY_ORDER.map((day, index) => [day, index]));
const WEEKDAY_DISPLAY_LABELS: Record<WeekdayKey, string> = {
  Dom: "Domingo",
  Seg: "Segunda-feira",
  Ter: "Terça-feira",
  Qua: "Quarta-feira",
  Qui: "Quinta-feira",
  Sex: "Sexta-feira",
  Sab: "Sábado",
};

const MONTHLY_WEEK_LABELS: Record<MonthlyRecurrenceWeek, string> = {
  1: "1a",
  2: "2a",
  3: "3a",
  4: "4a",
  5: "5a",
  [-1]: "última",
};

const canonicalizeWeekday = (day: string) => {
  const trimmed = day.trim();

  if (
    trimmed === "SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡b" ||
    trimmed === "SÃƒÆ’Ã‚Â¡bado" ||
    trimmed === "SÃƒÂ¡b" ||
    trimmed === "SÃƒÂ¡bado" ||
    trimmed === "Sabado"
  ) {
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

const formatWeekdayDisplay = (day: string) =>
  WEEKDAY_DISPLAY_LABELS[canonicalizeWeekday(day) as WeekdayKey] ?? day;

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

const numberToWeekday = (day: number): WeekdayKey => WEEKDAY_ORDER[day] ?? "Dom";

const normalizeMonthlyWeek = (value: unknown): MonthlyRecurrenceWeek | null => {
  if (typeof value !== "number") {
    return null;
  }

  if (value === -1 || (value >= 1 && value <= 5)) {
    return value as MonthlyRecurrenceWeek;
  }

  return null;
};

const getMonthDayKey = (dayOfMonth: number) => `day:${dayOfMonth}`;
const getMonthWeekdayKey = (week: MonthlyRecurrenceWeek, weekday: string) =>
  `weekday:${week}:${canonicalizeWeekday(weekday)}`;

const getMonthlyRuleKey = (rule: MonthlyRecurrenceRule) =>
  rule.kind === "dayOfMonth"
    ? getMonthDayKey(rule.dayOfMonth)
    : getMonthWeekdayKey(rule.week, rule.weekday);

const resolveMonthlyDay = (meeting: Pick<Meeting, "date" | "recurrenceDayOfMonth">) => {
  if (typeof meeting.recurrenceDayOfMonth === "number" && meeting.recurrenceDayOfMonth >= 1) {
    return meeting.recurrenceDayOfMonth;
  }

  return parseLocalDate(meeting.date).getDate();
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

const getWeekdayOccurrenceInMonth = (date: Date) => Math.floor((date.getDate() - 1) / 7) + 1;

const isLastWeekdayOfMonth = (date: Date) => addDays(date, 7).getMonth() !== date.getMonth();

const isMonthlyRecurrenceRule = (value: unknown): value is MonthlyRecurrenceRule =>
  typeof value === "object" && value !== null;

export const normalizeMonthlyRecurrenceRule = (rule: unknown): MonthlyRecurrenceRule | null => {
  if (!isMonthlyRecurrenceRule(rule)) {
    return null;
  }

  if (rule.kind === "dayOfMonth") {
    const dayOfMonth =
      typeof rule.dayOfMonth === "number"
        ? rule.dayOfMonth
        : typeof rule.dayOfMonth === "string"
          ? Number(rule.dayOfMonth)
          : NaN;

    if (Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31) {
      return {
        kind: "dayOfMonth",
        dayOfMonth,
      };
    }
  }

  if (rule.kind === "weekday") {
    const week =
      typeof rule.week === "number"
        ? normalizeMonthlyWeek(rule.week)
        : typeof rule.week === "string"
          ? normalizeMonthlyWeek(Number(rule.week))
          : null;
    const weekday =
      typeof rule.weekday === "string" ? canonicalizeWeekday(rule.weekday) : null;

    if (week && weekday && weekdayToNumber(weekday) !== null) {
      return {
        kind: "weekday",
        week,
        weekday,
      };
    }
  }

  return null;
};

export const normalizeMonthlyRecurrenceRules = (
  rules: unknown,
): MonthlyRecurrenceRule[] => {
  if (!Array.isArray(rules)) {
    return [];
  }

  const unique = new Map<string, MonthlyRecurrenceRule>();

  rules.forEach((rule) => {
    const normalized = normalizeMonthlyRecurrenceRule(rule);
    if (normalized) {
      unique.set(getMonthlyRuleKey(normalized), normalized);
    }
  });

  return Array.from(unique.values());
};

export const areMonthlyRecurrenceRulesEqual = (
  left: MonthlyRecurrenceRule,
  right: MonthlyRecurrenceRule,
) => getMonthlyRuleKey(left) === getMonthlyRuleKey(right);

export const formatMonthlyRecurrenceRule = (rule: MonthlyRecurrenceRule) => {
  if (rule.kind === "dayOfMonth") {
    return `dia ${rule.dayOfMonth}`;
  }

  return `${MONTHLY_WEEK_LABELS[rule.week]} ${formatWeekdayDisplay(rule.weekday)}`;
};

const formatMonthlyRecurrenceRuleFragment = (rule: MonthlyRecurrenceRule) => {
  if (rule.kind === "dayOfMonth") {
    return `no dia ${rule.dayOfMonth}`;
  }

  return `na ${MONTHLY_WEEK_LABELS[rule.week]} ${formatWeekdayDisplay(rule.weekday)}`;
};

const joinWithAnd = (items: string[]) => {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} e ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
};

const getLegacyMonthlyRule = (
  meeting: Pick<Meeting, "recurrenceDayOfMonth" | "recurrenceMonthlyWeek" | "recurrenceMonthlyWeekday">,
): MonthlyRecurrenceRule | null => {
  const week = normalizeMonthlyWeek(meeting.recurrenceMonthlyWeek);
  const weekday = meeting.recurrenceMonthlyWeekday
    ? canonicalizeWeekday(meeting.recurrenceMonthlyWeekday)
    : null;

  if (week && weekday && weekdayToNumber(weekday) !== null) {
    return {
      kind: "weekday",
      week,
      weekday,
    };
  }

  if (
    typeof meeting.recurrenceDayOfMonth === "number" &&
    meeting.recurrenceDayOfMonth >= 1 &&
    meeting.recurrenceDayOfMonth <= 31
  ) {
    return {
      kind: "dayOfMonth",
      dayOfMonth: meeting.recurrenceDayOfMonth,
    };
  }

  return null;
};

export const getMonthlyRecurrenceRules = (
  meeting: Pick<
    Meeting,
    | "recurrenceMonthlyRules"
    | "recurrenceDayOfMonth"
    | "recurrenceMonthlyWeek"
    | "recurrenceMonthlyWeekday"
  >,
): MonthlyRecurrenceRule[] => {
  const rules = normalizeMonthlyRecurrenceRules(meeting.recurrenceMonthlyRules);
  if (rules.length > 0) {
    return rules;
  }

  const legacyRule = getLegacyMonthlyRule(meeting);
  return legacyRule ? [legacyRule] : [];
};

const matchesMonthlyRule = (rule: MonthlyRecurrenceRule, targetDate: Date) => {
  if (rule.kind === "dayOfMonth") {
    return targetDate.getDate() === rule.dayOfMonth;
  }

  if (weekdayToNumber(rule.weekday) !== targetDate.getDay()) {
    return false;
  }

  if (rule.week === -1) {
    return isLastWeekdayOfMonth(targetDate);
  }

  return getWeekdayOccurrenceInMonth(targetDate) === rule.week;
};

const getEffectiveRecurrenceType = (
  meeting: Pick<Meeting, "recurrenceType" | "recurrenceDayOfMonth">,
): RecurrenceType | null => {
  if (meeting.recurrenceType === "daily" && typeof meeting.recurrenceDayOfMonth === "number") {
    return "monthly";
  }

  return meeting.recurrenceType ?? null;
};

export const getWeekdayFromDate = (value: Date | string) => {
  const date = typeof value === "string" ? parseLocalDate(value) : value;
  return numberToWeekday(date.getDay());
};

export const getMonthlyWeekdayPatternFromDate = (
  value: Date | string,
): { week: MonthlyRecurrenceWeek; weekday: WeekdayKey } => {
  const date = typeof value === "string" ? parseLocalDate(value) : value;
  const week = isLastWeekdayOfMonth(date)
    ? -1
    : (getWeekdayOccurrenceInMonth(date) as MonthlyRecurrenceWeek);

  return {
    week,
    weekday: numberToWeekday(date.getDay()),
  };
};

interface RecurringMeetingShape {
  date: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceDaysOfWeek?: string[] | null;
  recurrenceMonthlyWeek?: MonthlyRecurrenceWeek | null;
  recurrenceMonthlyWeekday?: string | null;
  recurrenceMonthlyRules?: MonthlyRecurrenceRule[] | null;
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

  const recurrenceType = getEffectiveRecurrenceType(meeting);
  if (recurrenceType === "daily") {
    return true;
  }

  if (recurrenceType === "weekly") {
    const days = normalizeWeekdays(meeting.recurrenceDaysOfWeek);
    if (days.length === 0) {
      return false;
    }

    const targetWeekday = parseLocalDate(dateKey).getDay();
    return days.some((day) => weekdayToNumber(day) === targetWeekday);
  }

  if (recurrenceType === "monthly") {
    const parsedTargetDate = parseLocalDate(dateKey);
    const monthlyRules = getMonthlyRecurrenceRules(meeting);

    if (monthlyRules.length > 0) {
      return monthlyRules.some((rule) => matchesMonthlyRule(rule, parsedTargetDate));
    }

    return parsedTargetDate.getDate() === resolveMonthlyDay(meeting);
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

export const getRecurrenceFrequencyLabel = (
  recurrenceType?: RecurrenceType | null,
  recurrenceDayOfMonth?: number | null,
) => {
  const effectiveType = getEffectiveRecurrenceType({
    recurrenceType,
    recurrenceDayOfMonth,
  });

  if (effectiveType === "daily") {
    return "Diária";
  }

  if (effectiveType === "weekly") {
    return "Semanal";
  }

  if (effectiveType === "monthly") {
    return "Mensal";
  }

  return "Recorrente";
};

export const getRecurrenceSummary = (
  meeting: Pick<
    Meeting,
    | "date"
    | "isRecurring"
    | "recurrenceType"
    | "recurrenceDayOfMonth"
    | "recurrenceDaysOfWeek"
    | "recurrenceMonthlyWeek"
    | "recurrenceMonthlyWeekday"
    | "recurrenceMonthlyRules"
  >,
) => {
  if (!meeting.isRecurring) {
    return null;
  }

  const recurrenceType = getEffectiveRecurrenceType(meeting);
  if (recurrenceType === "daily") {
    return "Todos os dias";
  }

  if (recurrenceType === "weekly") {
    const days = normalizeWeekdays(meeting.recurrenceDaysOfWeek);
    if (days.length > 0) {
      return `Toda semana em ${joinWithAnd(days.map(formatWeekdayDisplay))}`;
    }

    return "Repetição semanal";
  }

  if (recurrenceType === "monthly") {
    const monthlyRules = getMonthlyRecurrenceRules(meeting);
    if (monthlyRules.length > 0) {
      return `Todo mês ${joinWithAnd(monthlyRules.map(formatMonthlyRecurrenceRuleFragment))}`;
    }

    return `Todo mês no dia ${resolveMonthlyDay(meeting)}`;
  }

  return "Reunião recorrente";
};

export const getRecurrenceDetails = (
  meeting: Pick<
    Meeting,
    | "date"
    | "isRecurring"
    | "recurrenceType"
    | "recurrenceDayOfMonth"
    | "recurrenceDaysOfWeek"
    | "recurrenceMonthlyWeek"
    | "recurrenceMonthlyWeekday"
    | "recurrenceMonthlyRules"
  >,
) => {
  if (!meeting.isRecurring) {
    return [];
  }

  return [
    {
      label: "Início",
      value: format(parseLocalDate(meeting.date), "dd/MM/yyyy"),
    },
    {
      label: "Frequência",
      value: getRecurrenceFrequencyLabel(meeting.recurrenceType, meeting.recurrenceDayOfMonth),
    },
    {
      label: "Repetição",
      value: getRecurrenceSummary(meeting) ?? "Reunião recorrente",
    },
  ];
};
