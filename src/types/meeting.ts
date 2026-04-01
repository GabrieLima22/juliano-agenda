export type MeetingType = "presencial" | "zoom" | "meet" | "external";

export type RecurrenceType = "daily" | "weekly" | "monthly";
export type MonthlyRecurrenceMode = "dayOfMonth" | "weekday";
export type MonthlyRecurrenceWeek = 1 | 2 | 3 | 4 | 5 | -1;

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  presencial: "Presencial",
  zoom: "Zoom",
  meet: "Google Meet",
  external: "Reuniao Externa",
};

export const getMeetingTypeLabel = (meetingType: MeetingType = "presencial") =>
  MEETING_TYPE_LABELS[meetingType];

export const meetingTypeRequiresOnlineLink = (meetingType: MeetingType = "presencial") =>
  meetingType === "zoom" || meetingType === "meet";

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  participants: string[];
  description?: string; // Pauta / descricao
  durationMinutes?: number; // duracao em minutos
  meetingType?: MeetingType;
  onlineLink?: string | null; // obrigatorio quando zoom/meet
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceDayOfMonth?: number | null; // 1-31 para recorrencia mensal em dia fixo
  recurrenceDaysOfWeek?: string[] | null; // ['Seg','Ter',...] para tipo 'weekly'
  recurrenceMonthlyWeek?: MonthlyRecurrenceWeek | null; // 1-5 ou -1 (ultima)
  recurrenceMonthlyWeekday?: string | null; // 'Seg', 'Ter', ... para recorrencia mensal por semana/dia
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}
