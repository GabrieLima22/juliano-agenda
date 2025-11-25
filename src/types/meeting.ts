export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  participants: string[];
  description?: string; // Pauta / descrição
  durationMinutes?: number; // duração em minutos
  meetingType?: "presencial" | "zoom" | "meet" | "externa";
  onlineLink?: string | null; // obrigatório quando zoom/meet
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}
