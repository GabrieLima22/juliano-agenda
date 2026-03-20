export type MeetingType = "presencial" | "zoom" | "meet" | "external";

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  presencial: "Presencial",
  zoom: "Zoom",
  meet: "Google Meet",
  external: "Reunião Externa",
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
  description?: string; // Pauta / descrição
  durationMinutes?: number; // duração em minutos
  meetingType?: MeetingType;
  onlineLink?: string | null; // obrigatório quando zoom/meet
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}
