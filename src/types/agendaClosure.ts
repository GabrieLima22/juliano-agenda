export interface AgendaClosureSettings {
  isEnabled: boolean;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  message: string | null;
  updatedAt: string | null;
  remainingSeconds: number | null;
}

export interface AgendaClosurePayload {
  startsAt: string;
  endsAt: string;
  message?: string | null;
}
