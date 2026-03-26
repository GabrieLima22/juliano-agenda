import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, Users, FileText, Timer, Video, Link as LinkIcon, X } from "lucide-react";
import { Meeting, MeetingType, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseDurationInput } from "@/lib/duration";
import { generateClientId } from "@/lib/id";

interface NewMeetingDialogProps {
  selectedDate: Date | null;
  onSave: (meeting: Meeting) => Promise<void> | void;
  trigger?: ReactNode;
}

export const NewMeetingDialog = ({ selectedDate, onSave, trigger }: NewMeetingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
  const [time, setTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("presencial");
  const [onlineLink, setOnlineLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requiresOnlineLink = meetingTypeRequiresOnlineLink(meetingType);

  useEffect(() => {
    if (!open) {
      setDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
    }
  }, [open, selectedDate]);

  const handleDurationBlur = () => {
    if (!durationInput.trim()) {
      return;
    }

    const parsed = parseDurationInput(durationInput);
    if (parsed) {
      setDurationInput(parsed.formatted);
    } else {
      toast.error("Informe a duracao em minutos ou no formato HH:MM.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !time) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }
    if (requiresOnlineLink && !onlineLink.trim()) {
      toast.error("Informe o link da reuniao");
      return;
    }

    const parsedDuration = durationInput ? parseDurationInput(durationInput) : null;
    if (durationInput && !parsedDuration) {
      toast.error("Informe a duracao em minutos ou no formato HH:MM.");
      return;
    }

    const participantsList = participants
      .split(",")
      .map((participant) => participant.trim())
      .filter((participant) => participant.length > 0);

    const meeting: Meeting = {
      id: generateClientId(),
      title,
      date,
      time,
      participants: participantsList,
      description,
      durationMinutes: parsedDuration?.minutes,
      meetingType,
      onlineLink: requiresOnlineLink ? onlineLink.trim() || null : null,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setIsSubmitting(true);
    try {
      await onSave(meeting);

      setTitle("");
      setDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
      setTime("");
      setParticipants("");
      setDescription("");
      setDurationInput("");
      setMeetingType("presencial");
      setOnlineLink("");
      setOpen(false);

      toast.success("Solicitacao enviada! Aguarde aprovacao.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar a reuniao.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="lg"
            className="gradient-primary rounded-2xl px-6 font-semibold text-white shadow-elegant hover:scale-105 animate-smooth"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nova Reuniao
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[min(98vw,900px)] max-h-[92vh] overflow-hidden border border-border/50 bg-background p-0 shadow-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border/50 bg-background/95 bg-gradient-to-r from-background via-primary/10 to-background px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="absolute right-3 top-3">
            <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
          <DialogTitle className="gradient-text text-2xl">Agendar Reuniao</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(92vh-80px)] space-y-5 overflow-y-auto px-6 py-5 pb-36">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Titulo da Reuniao *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reuniao de planejamento"
                className="rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Data *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Horario *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="participants" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Participantes
              </Label>
              <Input
                id="participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Ex: Joao, Maria, Pedro"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Pauta
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Topicos a serem discutidos na reuniao..."
                className="min-h-[96px] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  Tempo de duracao
                </Label>
                <Input
                  id="duration"
                  type="text"
                  placeholder="Ex: 01:30 ou 90"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  onBlur={handleDurationBlur}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Tipo de reuniao
                </Label>
                <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                  <SelectTrigger className="rounded-xl">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="onlineLink" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  Link da reuniao ({getMeetingTypeLabel(meetingType)})
                </Label>
                <Input
                  id="onlineLink"
                  type="url"
                  value={onlineLink}
                  onChange={(e) => setOnlineLink(e.target.value)}
                  placeholder={`Cole o link do ${getMeetingTypeLabel(meetingType)}`}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 z-10 gap-3 border-t border-border/50 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:gap-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gradient-primary rounded-xl font-semibold text-white shadow-elegant hover:scale-105 animate-smooth"
            >
              {isSubmitting ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
