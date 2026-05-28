import { format, formatDistanceStrict, intervalToDuration } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaClosureSettings } from "@/types/agendaClosure";

const parseDateTime = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toDateTimeLocalValue = (value: string | null | undefined) => {
  const parsed = parseDateTime(value);
  if (!parsed) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const fromDateTimeLocalValue = (value: string) => value.trim();

export const isAgendaClosureActive = (
  closure: Pick<AgendaClosureSettings, "isEnabled" | "startsAt" | "endsAt"> | null | undefined,
  now: Date = new Date(),
) => {
  if (!closure?.isEnabled || !closure.startsAt || !closure.endsAt) {
    return false;
  }

  const startsAt = parseDateTime(closure.startsAt);
  const endsAt = parseDateTime(closure.endsAt);
  if (!startsAt || !endsAt) {
    return false;
  }

  return now >= startsAt && now <= endsAt;
};

export const formatAgendaClosureDate = (value: string | null | undefined) => {
  const parsed = parseDateTime(value);
  if (!parsed) {
    return "--";
  }

  return format(parsed, "dd 'de' MMM, yyyy", { locale: ptBR });
};

export const formatAgendaClosureDateTime = (value: string | null | undefined) => {
  const parsed = parseDateTime(value);
  if (!parsed) {
    return "--";
  }

  return format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const getAgendaClosureRemainingLabel = (
  closure: Pick<AgendaClosureSettings, "isEnabled" | "startsAt" | "endsAt"> | null | undefined,
  now: Date = new Date(),
) => {
  if (!isAgendaClosureActive(closure, now) || !closure?.endsAt) {
    return null;
  }

  const endsAt = parseDateTime(closure.endsAt);
  if (!endsAt) {
    return null;
  }

  return formatDistanceStrict(now, endsAt, { locale: ptBR });
};

export const getAgendaClosureDurationParts = (
  closure: Pick<AgendaClosureSettings, "startsAt" | "endsAt"> | null | undefined,
) => {
  const startsAt = parseDateTime(closure?.startsAt);
  const endsAt = parseDateTime(closure?.endsAt);

  if (!startsAt || !endsAt) {
    return [];
  }

  const duration = intervalToDuration({ start: startsAt, end: endsAt });
  const parts = [
    duration.days ? `${duration.days}d` : null,
    duration.hours ? `${duration.hours}h` : null,
    duration.minutes ? `${duration.minutes}min` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts : ["menos de 1h"];
};
