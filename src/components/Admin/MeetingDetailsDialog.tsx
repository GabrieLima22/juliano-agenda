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
import { Meeting, MeetingType, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import { MeetingUpdatePayload } from "@/lib/meetingStorage";
import { formatDuration, parseDurationInput } from "@/lib/duration";
import { getRecurrenceDetails, getRecurrenceSummary } from "@/lib/recurrence";
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
  const requiresOnlineLink = meetingTypeRequiresOnlineLink(meetingType);

  const handleDurationBlur = () => {
    if (!durationInput.trim()) {
      return;
    }

    const parsed = parseDurationInput(durationInput);
    if (parsed) {
      setDurationInput(parsed.formatted);
      return;
    }

    // eslint-disable-next-line no-alert
    alert("Informe a duracao em minutos ou no formato HH:MM.");
  };

  useEffect(() => {
    if (!open || !meeting) {
      return;
    }

    setTitle(meeting.title);
    setDate(meeting.date);
    setTime(meeting.time);
    setParticipants(meeting.participants.join(", "));
    setDescription(meeting.description ?? "");
    setDurationInput(
      typeof meeting.durationMinutes === "number" && meeting.durationMinutes >= 0
        ? formatDuration(meeting.durationMinutes)
        : "",
    );
    setMeetingType(meeting.meetingType ?? "presencial");
    setOnlineLink(meeting.onlineLink ?? "");
    setStatus(meeting.status);
  }, [meeting, open]);

  const createdAtLabel = useMemo(() => {
    if (!meeting) {
      return "";
    }

    try {
      return format(new Date(meeting.createdAt), "dd/MM/yyyy 'as' HH:mm");
    } catch {
      return meeting.createdAt;
    }
  }, [meeting]);

  const recurrenceSource = useMemo(() => {
    if (!meeting) {
      return null;
    }

    return {
      ...meeting,
      date: date || meeting.date,
    };
  }, [meeting, date]);

  const recurrenceSummary = useMemo(() => {
    if (!recurrenceSource) {
      return null;
    }

    return getRecurrenceSummary(recurrenceSource);
  }, [recurrenceSource]);

  const recurrenceDetails = useMemo(() => {
    if (!recurrenceSource) {
      return [];
    }

    return getRecurrenceDetails(recurrenceSource);
  }, [recurrenceSource]);

  if (!meeting) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !date || !time) {
      // eslint-disable-next-line no-alert
      alert("Titulo, data e horario sao obrigatorios.");
      return;
    }

    if (requiresOnlineLink && !onlineLink.trim()) {
      // eslint-disable-next-line no-alert
      alert("Informe o link da reuniao para reunioes online.");
      return;
    }

    const participantsList = participants
      .split(",")
      .map((participant) => participant.trim())
      .filter((participant) => participant.length > 0);

    const parsedDuration = durationInput ? parseDurationInput(durationInput) : null;
    if (durationInput && !parsedDuration) {
      // eslint-disable-next-line no-alert
      alert("Informe a duracao em minutos ou no formato HH:MM.");
      return;
    }

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

    onSave(payload);
  };

  const handleDelete = () => {
    onDelete(meeting);
  };

  const statusLabel: Record<MeetingStatus, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Rejeitada",
  };

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

            <DialogTitle className="text-xl font-semibold text-foreground">
              Gerenciar reuniao
            </DialogTitle>
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
                        <p className="text-xs text-slate-500">
                          Esta solicitacao usa repeticao automatica.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {recurrenceDetails.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 px-3.5 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500">
                            {item.label}
                          </p>
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
                    <Input
                      id="meeting-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                      className="rounded-xl"
                    />
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
                      {meeting.isRecurring ? "Data de inicio" : "Data"}
                    </Label>
                    <Input
                      id="meeting-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                      className="rounded-xl"
                    />
                    {meeting.isRecurring && (
                      <p className="text-xs text-slate-500">
                        Primeira ocorrencia: {format(parseLocalDate(date || meeting.date), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-time" className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-primary" />
                      Horario
                    </Label>
                    <Input
                      id="meeting-time"
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

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
