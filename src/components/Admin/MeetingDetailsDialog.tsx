import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Link as LinkIcon, RefreshCw, Timer, Trash2, Users, Video, X } from "lucide-react";
import { format } from "date-fns";
import {
  Meeting,
  MeetingType,
  MonthlyRecurrenceMode,
  MonthlyRecurrenceWeek,
  RecurrenceType,
  getMeetingTypeLabel,
  meetingTypeRequiresOnlineLink,
} from "@/types/meeting";
import { MeetingUpdatePayload } from "@/lib/meetingStorage";
import { formatDuration, parseDurationInput } from "@/lib/duration";
import {
  MONTHLY_RECURRENCE_WEEKS,
  RECURRENCE_WEEKDAYS,
  getMonthlyWeekdayPatternFromDate,
  getRecurrenceDetails,
  getRecurrenceSummary,
  getWeekdayFromDate,
} from "@/lib/recurrence";
import { parseLocalDate } from "@/lib/utils";

interface MeetingDetailsDialogProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (changes: MeetingUpdatePayload) => Promise<void> | void;
  onDelete: (meeting: Meeting) => Promise<void> | void;
  saving?: boolean;
  deleting?: boolean;
}

type MeetingStatus = Meeting["status"];

const MONTHLY_WEEK_LABELS: Record<MonthlyRecurrenceWeek, string> = {
  1: "1a",
  2: "2a",
  3: "3a",
  4: "4a",
  5: "5a",
  [-1]: "Ultima",
};

const buildDateBasedDefaults = (dateValue: string) => {
  const safeDate = dateValue || format(new Date(), "yyyy-MM-dd");
  const monthlyPattern = getMonthlyWeekdayPatternFromDate(safeDate);

  return {
    recurrenceDayOfMonth: parseLocalDate(safeDate).getDate(),
    recurrenceWeekday: getWeekdayFromDate(safeDate),
    recurrenceMonthlyWeek: monthlyPattern.week,
    recurrenceMonthlyWeekday: monthlyPattern.weekday,
  };
};

const resolveEditorRecurrenceType = (meeting: Meeting): RecurrenceType => {
  if (meeting.recurrenceType === "daily" && typeof meeting.recurrenceDayOfMonth === "number") {
    return "monthly";
  }

  return meeting.recurrenceType ?? "weekly";
};

export const MeetingDetailsDialog = ({
  meeting,
  open,
  onOpenChange,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
}: MeetingDetailsDialogProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("presencial");
  const [onlineLink, setOnlineLink] = useState("");
  const [status, setStatus] = useState<MeetingStatus>("pending");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number>(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<string[]>([]);
  const [monthlyRecurrenceMode, setMonthlyRecurrenceMode] = useState<MonthlyRecurrenceMode>("dayOfMonth");
  const [recurrenceMonthlyWeek, setRecurrenceMonthlyWeek] = useState<MonthlyRecurrenceWeek>(1);
  const [recurrenceMonthlyWeekday, setRecurrenceMonthlyWeekday] = useState<string>("Seg");
  const requiresOnlineLink = meetingTypeRequiresOnlineLink(meetingType);

  const handleDurationBlur = () => {
    if (!durationInput.trim()) return;
    const parsed = parseDurationInput(durationInput);
    if (parsed) {
      setDurationInput(parsed.formatted);
      return;
    }
    alert("Informe a duracao em minutos ou no formato HH:MM.");
  };

  const toggleWeekDay = (day: string) => {
    setRecurrenceDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleRecurrenceTypeChange = (type: RecurrenceType) => {
    setRecurrenceType(type);
    const defaults = buildDateBasedDefaults(date || meeting?.date || "");
    if (type === "weekly" && recurrenceDaysOfWeek.length === 0) setRecurrenceDaysOfWeek([defaults.recurrenceWeekday]);
    if (type === "monthly") {
      setRecurrenceDayOfMonth((current) => current || defaults.recurrenceDayOfMonth);
      setRecurrenceMonthlyWeek((current) => current || defaults.recurrenceMonthlyWeek);
      setRecurrenceMonthlyWeekday((current) => current || defaults.recurrenceMonthlyWeekday);
    }
  };

  useEffect(() => {
    if (!open || !meeting) return;

    const defaults = buildDateBasedDefaults(meeting.date);
    const effectiveRecurrenceType = resolveEditorRecurrenceType(meeting);
    const hasMonthlyWeekdayRule =
      effectiveRecurrenceType === "monthly" &&
      meeting.recurrenceMonthlyWeek !== null &&
      meeting.recurrenceMonthlyWeek !== undefined &&
      Boolean(meeting.recurrenceMonthlyWeekday);

    setTitle(meeting.title);
    setDate(meeting.date);
    setTime(meeting.time);
    setParticipants(meeting.participants.join(", "));
    setDescription(meeting.description ?? "");
    setDurationInput(typeof meeting.durationMinutes === "number" && meeting.durationMinutes >= 0 ? formatDuration(meeting.durationMinutes) : "");
    setMeetingType(meeting.meetingType ?? "presencial");
    setOnlineLink(meeting.onlineLink ?? "");
    setStatus(meeting.status);
    setRecurrenceType(effectiveRecurrenceType);
    setRecurrenceDayOfMonth(meeting.recurrenceDayOfMonth ?? defaults.recurrenceDayOfMonth);
    setRecurrenceDaysOfWeek(meeting.recurrenceDaysOfWeek?.length ? meeting.recurrenceDaysOfWeek : [defaults.recurrenceWeekday]);
    setMonthlyRecurrenceMode(hasMonthlyWeekdayRule ? "weekday" : "dayOfMonth");
    setRecurrenceMonthlyWeek((meeting.recurrenceMonthlyWeek as MonthlyRecurrenceWeek | null) ?? defaults.recurrenceMonthlyWeek);
    setRecurrenceMonthlyWeekday(meeting.recurrenceMonthlyWeekday ?? defaults.recurrenceMonthlyWeekday);
  }, [meeting, open]);

  const createdAtLabel = useMemo(() => {
    if (!meeting) return "";
    try {
      return format(new Date(meeting.createdAt), "dd/MM/yyyy 'as' HH:mm");
    } catch {
      return meeting.createdAt;
    }
  }, [meeting]);

  const recurrenceSource = useMemo(() => {
    if (!meeting) return null;
    if (!meeting.isRecurring) return { ...meeting, date: date || meeting.date };

    return {
      ...meeting,
      date: date || meeting.date,
      recurrenceType,
      recurrenceDayOfMonth: recurrenceType === "monthly" && monthlyRecurrenceMode === "dayOfMonth" ? recurrenceDayOfMonth : null,
      recurrenceDaysOfWeek: recurrenceType === "weekly" ? recurrenceDaysOfWeek : null,
      recurrenceMonthlyWeek: recurrenceType === "monthly" && monthlyRecurrenceMode === "weekday" ? recurrenceMonthlyWeek : null,
      recurrenceMonthlyWeekday: recurrenceType === "monthly" && monthlyRecurrenceMode === "weekday" ? recurrenceMonthlyWeekday : null,
    };
  }, [date, meeting, monthlyRecurrenceMode, recurrenceDayOfMonth, recurrenceDaysOfWeek, recurrenceMonthlyWeek, recurrenceMonthlyWeekday, recurrenceType]);

  const recurrenceSummary = useMemo(() => (recurrenceSource ? getRecurrenceSummary(recurrenceSource) : null), [recurrenceSource]);
  const recurrenceDetails = useMemo(() => (recurrenceSource ? getRecurrenceDetails(recurrenceSource) : []), [recurrenceSource]);

  if (!meeting) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !date || !time) return alert("Titulo, data e horario sao obrigatorios.");
    if (requiresOnlineLink && !onlineLink.trim()) return alert("Informe o link da reuniao para reunioes online.");
    if (meeting.isRecurring && recurrenceType === "weekly" && recurrenceDaysOfWeek.length === 0) return alert("Selecione pelo menos um dia da semana.");
    if (meeting.isRecurring && recurrenceType === "monthly" && monthlyRecurrenceMode === "weekday" && !recurrenceMonthlyWeekday) return alert("Selecione o dia da semana da recorrencia mensal.");

    const participantsList = participants.split(",").map((participant) => participant.trim()).filter((participant) => participant.length > 0);
    const parsedDuration = durationInput ? parseDurationInput(durationInput) : null;
    if (durationInput && !parsedDuration) return alert("Informe a duracao em minutos ou no formato HH:MM.");

    const payload: MeetingUpdatePayload = {
      id: meeting.id,
      title: title.trim(),
      date,
      time,
      participants: participantsList,
      description: description.trim() ? description.trim() : null,
      durationMinutes: parsedDuration ? parsedDuration.minutes : null,
      meetingType,
      onlineLink: requiresOnlineLink ? onlineLink.trim() : null,
      status,
    };

    if (meeting.isRecurring) {
      payload.recurrenceType = recurrenceType;
      payload.recurrenceDayOfMonth = recurrenceType === "monthly" && monthlyRecurrenceMode === "dayOfMonth" ? recurrenceDayOfMonth : null;
      payload.recurrenceDaysOfWeek = recurrenceType === "weekly" ? recurrenceDaysOfWeek : null;
      payload.recurrenceMonthlyWeek = recurrenceType === "monthly" && monthlyRecurrenceMode === "weekday" ? recurrenceMonthlyWeek : null;
      payload.recurrenceMonthlyWeekday = recurrenceType === "monthly" && monthlyRecurrenceMode === "weekday" ? recurrenceMonthlyWeekday : null;
    }

    onSave(payload);
  };

  const handleDelete = () => onDelete(meeting);
  const statusLabel: Record<MeetingStatus, string> = { pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada" };
  const statusStyle: Record<MeetingStatus, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,720px)] max-h-[92vh] overflow-hidden rounded-[1.75rem] border border-border/40 bg-background p-0 shadow-2xl">
        <div className="flex max-h-[92vh] min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b border-border/40 bg-background/95 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="absolute right-4 top-4">
              <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </DialogClose>
            </div>

            <DialogTitle className="text-xl font-semibold text-foreground">Gerenciar reuniao</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground" translate="no">
              Criada em {createdAtLabel}
            </DialogDescription>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle[status]}`}>
                {statusLabel[status]}
              </span>
              {meeting.isRecurring && recurrenceSummary && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <RefreshCw className="h-3 w-3" />
                  {recurrenceSummary}
                </span>
              )}
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5 pb-2">
                {meeting.isRecurring && recurrenceDetails.length > 0 && (
                  <section className="rounded-[1.35rem] border border-violet-200/70 bg-violet-50/75 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Recorrencia configurada</h3>
                        <p className="text-xs text-slate-500">Esta solicitacao usa repeticao automatica.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {recurrenceDetails.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 px-3.5 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500">{item.label}</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-title" className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      Titulo
                    </Label>
                    <Input id="meeting-title" value={title} onChange={(event) => setTitle(event.target.value)} required className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-status" className="flex items-center gap-2 text-sm font-medium">
                      Status
                    </Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as MeetingStatus)}>
                      <SelectTrigger id="meeting-status" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovada</SelectItem>
                        <SelectItem value="rejected">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-date" className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      {meeting.isRecurring ? "Inicio da serie" : "Data"}
                    </Label>
                    <Input id="meeting-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="rounded-xl" />
                    {meeting.isRecurring && (
                      <p className="text-xs text-slate-500">Serie ativa a partir de {format(parseLocalDate(date || meeting.date), "dd/MM/yyyy")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-time" className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-primary" />
                      Horario
                    </Label>
                    <Input id="meeting-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required className="rounded-xl" />
                  </div>
                </div>

                {meeting.isRecurring && (
                  <section className="space-y-4 rounded-[1.35rem] border border-border/50 bg-slate-50/75 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Editar recorrencia</h3>
                        <p className="text-xs text-slate-500">Ajuste diario, semanal ou mensal e confira o resumo.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button type="button" onClick={() => handleRecurrenceTypeChange("daily")} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${recurrenceType === "daily" ? "border-violet-500/40 bg-violet-600 text-white shadow-[0_12px_24px_-18px_rgba(109,40,217,0.6)]" : "border-border/40 bg-background text-muted-foreground hover:border-border"}`}>Diario</button>
                        <button type="button" onClick={() => handleRecurrenceTypeChange("weekly")} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${recurrenceType === "weekly" ? "border-violet-500/40 bg-violet-600 text-white shadow-[0_12px_24px_-18px_rgba(109,40,217,0.6)]" : "border-border/40 bg-background text-muted-foreground hover:border-border"}`}>Semanal</button>
                        <button type="button" onClick={() => handleRecurrenceTypeChange("monthly")} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${recurrenceType === "monthly" ? "border-violet-500/40 bg-violet-600 text-white shadow-[0_12px_24px_-18px_rgba(109,40,217,0.6)]" : "border-border/40 bg-background text-muted-foreground hover:border-border"}`}>Mensal</button>
                      </div>
                    </div>

                    {recurrenceType === "daily" && (
                      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
                        A reuniao vai se repetir todos os dias a partir da data de inicio.
                      </div>
                    )}

                    {recurrenceType === "weekly" && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Repetir nos dias:</p>
                        <div className="grid grid-cols-7 gap-2">
                          {RECURRENCE_WEEKDAYS.map((day) => (
                            <button key={day} type="button" onClick={() => toggleWeekDay(day)} className={`rounded-xl py-2.5 text-xs font-medium transition-all ${recurrenceDaysOfWeek.includes(day) ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/40 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>{day}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {recurrenceType === "monthly" && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Modelo mensal:</p>
                            <p className="mt-1 text-xs text-muted-foreground">Escolha entre dia fixo ou semana + dia da semana.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button type="button" onClick={() => setMonthlyRecurrenceMode("dayOfMonth")} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${monthlyRecurrenceMode === "dayOfMonth" ? "border-primary/40 bg-primary text-primary-foreground shadow-sm" : "border-border/40 bg-background text-muted-foreground hover:border-border"}`}>Dia fixo</button>
                            <button type="button" onClick={() => setMonthlyRecurrenceMode("weekday")} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${monthlyRecurrenceMode === "weekday" ? "border-primary/40 bg-primary text-primary-foreground shadow-sm" : "border-border/40 bg-background text-muted-foreground hover:border-border"}`}>Semana + dia</button>
                          </div>
                        </div>

                        {monthlyRecurrenceMode === "dayOfMonth" && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dia do mes:</p>
                            <div className="grid grid-cols-7 gap-1.5">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <button key={day} type="button" onClick={() => setRecurrenceDayOfMonth(day)} className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-all ${recurrenceDayOfMonth === day ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/40 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>{day}</button>
                              ))}
                            </div>
                          </div>
                        )}

                        {monthlyRecurrenceMode === "weekday" && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Semana do mes:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {MONTHLY_RECURRENCE_WEEKS.map((week) => (
                                  <button key={week} type="button" onClick={() => setRecurrenceMonthlyWeek(week)} className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${recurrenceMonthlyWeek === week ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/40 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>{MONTHLY_WEEK_LABELS[week]}</button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dia da semana:</p>
                              <div className="grid grid-cols-4 gap-2">
                                {RECURRENCE_WEEKDAYS.map((day) => (
                                  <button key={day} type="button" onClick={() => setRecurrenceMonthlyWeekday(day)} className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${recurrenceMonthlyWeekday === day ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/40 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>{day}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {recurrenceSummary && (
                      <div className="rounded-2xl border border-violet-200/70 bg-violet-50/80 px-4 py-3 text-sm text-violet-700">
                        <span className="font-medium">Resumo:</span> {recurrenceSummary}
                      </div>
                    )}
                  </section>
                )}

                <div className="space-y-2">
                  <Label htmlFor="meeting-participants" className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    Participantes (separe por virgulas)
                  </Label>
                  <Input
                    id="meeting-participants"
                    value={participants}
                    onChange={(event) => setParticipants(event.target.value)}
                    placeholder="Juliano, Maria, Pedro"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-description" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-primary" />
                    Pauta
                  </Label>
                  <Textarea
                    id="meeting-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Resumo do que sera discutido..."
                    className="min-h-[110px] rounded-xl resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-duration" className="flex items-center gap-2 text-sm font-medium">
                      <Timer className="h-4 w-4 text-primary" />
                      Duracao
                    </Label>
                    <Input
                      id="meeting-duration"
                      type="text"
                      placeholder="Ex: 01:30 ou 90"
                      value={durationInput}
                      onChange={(event) => setDurationInput(event.target.value)}
                      onBlur={handleDurationBlur}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-type" className="flex items-center gap-2 text-sm font-medium">
                      <Video className="h-4 w-4 text-primary" />
                      Tipo
                    </Label>
                    <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                      <SelectTrigger id="meeting-type" className="rounded-xl">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="external">Reuniao Externa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {requiresOnlineLink && (
                  <div className="space-y-2">
                    <Label htmlFor="meeting-link" className="flex items-center gap-2 text-sm font-medium">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      Link da reuniao ({getMeetingTypeLabel(meetingType)})
                    </Label>
                    <Input
                      id="meeting-link"
                      type="url"
                      value={onlineLink}
                      onChange={(event) => setOnlineLink(event.target.value)}
                      placeholder={`Cole o link do ${getMeetingTypeLabel(meetingType)}`}
                      className="rounded-xl"
                      required={requiresOnlineLink}
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border/40 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:justify-between sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="rounded-xl border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {meeting.isRecurring ? "Excluir serie" : "Excluir"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || deleting}
                className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                {saving ? "Salvando..." : "Salvar alteracoes"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
