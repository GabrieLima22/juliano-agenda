import { Meeting } from "@/types/meeting";

const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost/juliano-agenda/api"
    : "/api");

type FetchOptions = RequestInit & { json?: any };

async function request<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}/${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const init: RequestInit = {
    method: opts.method || "GET",
    headers: { ...headers, ...(opts.headers as any) },
    credentials: "include",
  };
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json);
  }
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }
  return data as T;
}

export const getMeetings = async (): Promise<Meeting[]> => {
  const rows = await request<any[]>("meetings.php?includeAll=true");
  return rows as Meeting[];
};

export const saveMeeting = async (meeting: Meeting): Promise<Meeting> => {
  const payload = {
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    participants: meeting.participants,
    description: meeting.description ?? null,
    durationMinutes: meeting.durationMinutes ?? null,
    meetingType: meeting.meetingType ?? 'presencial',
    onlineLink: meeting.onlineLink ?? null,
  };
  const created = await request<Meeting>("meetings.php", { method: "POST", json: payload });
  return created;
};

export const getMeetingsForDate = async (date: Date, includeAll: boolean = false): Promise<Meeting[]> => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`; // data local, evita shift por fuso
  const url = `meetings.php?date=${encodeURIComponent(dateStr)}${includeAll ? "&includeAll=true" : ""}`;
  const rows = await request<any[]>(url);
  return rows as Meeting[];
};

export const getPendingMeetings = async (): Promise<Meeting[]> => {
  const rows = await request<Meeting[]>("meetings.php?includeAll=true");
  return rows.filter((m) => m.status === "pending").sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const updateMeetingStatus = async (id: string, status: "approved" | "rejected"): Promise<void> => {
  await request("meetings.php", { method: "PATCH", json: { id, status } });
};

export const deleteMeeting = async (id: string): Promise<void> => {
  await request(`meetings.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
};

export interface MeetingUpdatePayload {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  participants?: string[];
  description?: string | null;
  durationMinutes?: number | null;
  meetingType?: "presencial" | "zoom" | "meet";
  onlineLink?: string | null;
  status?: Meeting["status"];
}

export const updateMeeting = async (payload: MeetingUpdatePayload): Promise<Meeting> => {
  const body: Record<string, unknown> = { id: payload.id };

  const append = <K extends keyof MeetingUpdatePayload>(key: K) => {
    const value = payload[key];
    if (value !== undefined) {
      body[key] = value;
    }
  };

  append("title");
  append("date");
  append("time");
  append("participants");
  append("description");
  append("durationMinutes");
  append("meetingType");
  append("onlineLink");
  append("status");

  return request<Meeting>("meetings.php", { method: "PATCH", json: body });
};
