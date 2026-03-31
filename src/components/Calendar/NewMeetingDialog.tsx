import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import {
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  Timer,
  Video,
  Link as LinkIcon,
  X,
  RefreshCw,
  Check,
} from "lucide-react";
import { Meeting, MeetingType, RecurrenceType, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseDurationInput } from "@/lib/duration";
import { generateClientId } from "@/lib/id";

interface NewMeetingDialogProps {
  selectedDate: Date | null;
  onSave: (meeting: Meeting) => Promise<void> | void;
  trigger?: ReactNode;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number>(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<string[]>([]);
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

  const toggleWeekDay = (day: string) => {
    setRecurrenceDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const resetForm = () => {
    setTitle("");
    setDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
    setTime("");
    setParticipants("");
    setDescription("");
    setDurationInput("");
    setMeetingType("presencial");
    setOnlineLink("");
    setIsRecurring(false);
    setRecurrenceType("weekly");
    setRecurrenceDayOfMonth(1);
    setRecurrenceDaysOfWeek([]);
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
    if (isRecurring && recurrenceType === "weekly" && recurrenceDaysOfWeek.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
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
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : null,
      recurrenceDayOfMonth: isRecurring && recurrenceType === "daily" ? recurrenceDayOfMonth : null,
      recurrenceDaysOfWeek: isRecurring && recurrenceType === "weekly" ? recurrenceDaysOfWeek : null,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setIsSubmitting(true);
    try {
      await onSave(meeting);
      resetForm();
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
            className="rounded-2xl bg-foreground px-6 font-medium text-background hover:bg-foreground/90 animate-smooth"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nova Reuniao
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[min(98vw,640px)] max-h-[92vh] overflow-hidden border border-border/40 bg-background p-0 shadow-2xl rounded-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border/40 bg-background/95 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="absolute right-4 top-4">
            <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">Agendar Reuniao</DialogTitle>
          <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
            Configure os detalhes do seu encontro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 overflow-y-auto px-6 py-5 pb-8" style={{ maxHeight: "calc(92vh - 170px)" }}>
            <div className="relative grid grid-cols-2 rounded-[1.15rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(244,247,251,0.92))] p-1 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.78)]">
              <span
                aria-hidden="true"
                className={`absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-[0.9rem] border border-white/55 bg-[linear-gradient(135deg,rgba(79,70,229,0.96),rgba(59,130,246,0.9),rgba(20,184,166,0.82))] shadow-[0_16px_26px_-20px_rgba(59,130,246,0.42)] transition-transform duration-500 ${
                  isRecurring ? "translate-x-full" : "translate-x-0"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                aria-pressed={!isRecurring}
                className={`relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-[0.9rem] text-sm font-medium transition-all duration-300 ${
                  !isRecurring
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Calendar className="h-4 w-4" /> Reuniao Unica
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                aria-pressed={isRecurring}
                className={`relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-[0.9rem] text-sm font-medium transition-all duration-300 ${
                  isRecurring
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <RefreshCw className="h-4 w-4" /> Recorrente
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
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
                <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  {isRecurring ? "Data de Inicio *" : "Data *"}
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
                <Label htmlFor="time" className="flex items-center gap-2 text-sm font-medium">
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

            {isRecurring && (
              <div className="space-y-4 rounded-xl border border-border/40 bg-muted/30 p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Padrao de Repeticao</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Escolha como a reuniao se repetira.</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRecurrenceType("daily")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        recurrenceType === "daily"
                          ? "border-violet-500/40 bg-violet-600 text-white shadow-[0_12px_24px_-18px_rgba(109,40,217,0.6)]"
                          : "bg-background border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      Diario
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceType("weekly")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        recurrenceType === "weekly"
                          ? "border-violet-500/40 bg-violet-600 text-white shadow-[0_12px_24px_-18px_rgba(109,40,217,0.6)]"
                          : "bg-background border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      Semanal
                    </button>
                  </div>
                </div>

                {recurrenceType === "daily" && (
                  <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-1 motion-safe:duration-300">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Dia do mes:
                    </p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {MONTH_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setRecurrenceDayOfMonth(day)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                            recurrenceDayOfMonth === day
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-background border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrenceType === "weekly" && (
                  <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-1 motion-safe:duration-300">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Repetir nos dias:
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                      {WEEK_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWeekDay(day)}
                          className={`py-2.5 rounded-xl flex items-center justify-center text-xs font-medium transition-all ${
                            recurrenceDaysOfWeek.includes(day)
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-background border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="participants" className="flex items-center gap-2 text-sm font-medium">
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

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                Pauta
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Topicos a serem discutidos na reuniao..."
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium">
                  <Timer className="h-4 w-4 text-primary" />
                  Duracao
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
                <Label className="flex items-center gap-2 text-sm font-medium">
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
              <div className="space-y-2">
                <Label htmlFor="onlineLink" className="flex items-center gap-2 text-sm font-medium">
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

          <DialogFooter className="sticky bottom-0 z-10 gap-3 border-t border-border/40 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 animate-smooth"
            >
              <Check className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Salvando..."
                : isRecurring
                  ? "Agendar Recorrencia"
                  : "Confirmar Reuniao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
