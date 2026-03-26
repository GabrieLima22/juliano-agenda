import { Meeting, MeetingType } from "@/types/meeting";
import { resolveApiBase } from "@/lib/runtime";

const API_BASE = resolveApiBase();

type FetchOptions = Omit<RequestInit, "body"> & { json?: unknown };

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}/${path}`;
  const headers = new Headers(opts.headers);
  if (opts.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const init: RequestInit = {
    method: opts.method || "GET",
    headers,
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
  return request<Meeting[]>("meetings.php?includeAll=true");
};

export const saveMeeting = async (meeting: Meeting): Promise<Meeting> => {
  const payload = {
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    participants: meeting.participants,
    description: meeting.description ?? null,
    durationMinutes: meeting.durationMinutes ?? null,
    meetingType: meeting.meetingType ?? "presencial",
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
  return request<Meeting[]>(url);
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
  meetingType?: MeetingType;
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
