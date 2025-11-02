import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
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
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  FileText,
  Link as LinkIcon,
  Timer,
  Trash2,
  Users,
  Video,
  Pencil,
  Info,
} from "lucide-react";
import { Meeting } from "@/types/meeting";
import { format } from "date-fns";
import { MeetingUpdatePayload } from "@/lib/meetingStorage";
import { toast } from "sonner";

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
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [meetingType, setMeetingType] = useState<"presencial" | "zoom" | "meet">("presencial");
  const [onlineLink, setOnlineLink] = useState("");
  const [status, setStatus] = useState<MeetingStatus>("pending");

  useEffect(() => {
    if (!open || !meeting) {
      return;
    }
    setTitle(meeting.title);
    setDate(meeting.date);
    setTime(meeting.time);
    setParticipants(meeting.participants.join(", "));
    setDescription(meeting.description ?? "");
    setDurationMinutes(
      typeof meeting.durationMinutes === "number" && meeting.durationMinutes >= 0
        ? String(meeting.durationMinutes)
        : "",
    );
    setMeetingType(meeting.meetingType ?? "presencial");
    setOnlineLink(meeting.onlineLink ?? "");
    setStatus(meeting.status);
  }, [meeting, open]);

  const createdAtLabel = useMemo(() => {
    if (!meeting) return "";
    try {
      return format(new Date(meeting.createdAt), "dd/MM/yyyy 'às' HH:mm");
    } catch {
      return meeting.createdAt;
    }
  }, [meeting]);

  if (!meeting) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !date || !time) {
      toast.error("Título, data e horário são obrigatórios.");
      return;
    }

    if (meetingType !== "presencial" && !onlineLink.trim()) {
      toast.error("Informe o link da reunião para reuniões online.");
      return;
    }

    const participantsList = participants
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const parsedDuration = durationMinutes === "" ? null : Number(durationMinutes);
    if (parsedDuration !== null && (Number.isNaN(parsedDuration) || parsedDuration < 0)) {
      toast.error("Informe uma duração válida.");
      return;
    }

    const payload: MeetingUpdatePayload = {
      id: meeting.id,
      title: title.trim(),
      date,
      time,
      participants: participantsList,
      description: description.trim() ? description.trim() : null,
      durationMinutes: parsedDuration,
      meetingType,
      onlineLink: meetingType === "presencial" ? null : onlineLink.trim(),
      status,
    };

    onSave(payload);
  };

  const handleDelete = () => {
    onDelete(meeting);
  };

  const statusVariant: Record<MeetingStatus, string> = {
    pending: "bg-yellow-500/15 text-yellow-800 border-yellow-400/40",
    approved: "bg-green-500/15 text-green-800 border-green-400/40",
    rejected: "bg-red-500/15 text-red-800 border-red-400/40",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-none shadow-glass w-[min(95vw,620px)] max-h-[95vh] overflow-y-auto px-5 py-6 sm:p-8">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl gradient-text flex items-center gap-2" translate="no">
            <Pencil className="h-5 w-5 text-primary" />
            Gerenciar reunião
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" translate="no">
            <Info className="h-4 w-4 text-primary" />
            Criada em {createdAtLabel}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Status atual:</span>
            <Badge variant="outline" className={statusVariant[status]}>
              {status === "pending" ? "Pendente" : status === "approved" ? "Aprovada" : "Rejeitada"}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Título
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
              <Label htmlFor="meeting-status" className="flex items-center gap-2">
                <Badge className="h-4 w-4 bg-primary/10 text-primary border-none p-0 flex items-center justify-center">
                  {status === "approved" ? "A" : status === "rejected" ? "R" : "P"}
                </Badge>
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

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário
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
            <Label htmlFor="meeting-participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes (separe por vírgulas)
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
            <Label htmlFor="meeting-description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pauta
            </Label>
            <Textarea
              id="meeting-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Resumo do que será discutido..."
              className="rounded-xl min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-duration" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Duração (minutos)
              </Label>
              <Input
                id="meeting-duration"
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-type" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Tipo
              </Label>
              <Select value={meetingType} onValueChange={(value) => setMeetingType(value as any)}>
                <SelectTrigger id="meeting-type" className="rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {meetingType !== "presencial" && (
            <div className="space-y-2">
              <Label htmlFor="meeting-link" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link da reunião
              </Label>
              <Input
                id="meeting-link"
                type="url"
                value={onlineLink}
                onChange={(event) => setOnlineLink(event.target.value)}
                placeholder="https://..."
                className="rounded-xl"
                required={meetingType !== "presencial"}
              />
            </div>
          )}

          <DialogFooter className="pt-4 gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="border-red-500/40 text-red-600 hover:bg-red-500/10 hover:border-red-500 rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir reunião
            </Button>
            <Button
              type="submit"
              disabled={saving || deleting}
              className="gradient-primary text-white shadow-elegant hover:scale-105 animate-smooth rounded-xl"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
