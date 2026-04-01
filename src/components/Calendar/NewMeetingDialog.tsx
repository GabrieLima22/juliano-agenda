import { ReactNode, useEffect, useMemo, useState } from "react";
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
import {
  Meeting,
  MeetingType,
  MonthlyRecurrenceMode,
  MonthlyRecurrenceRule,
  MonthlyRecurrenceWeek,
  RecurrenceType,
  getMeetingTypeLabel,
  meetingTypeRequiresOnlineLink,
} from "@/types/meeting";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseDurationInput } from "@/lib/duration";
import { generateClientId } from "@/lib/id";
import {
  areMonthlyRecurrenceRulesEqual,
  getMonthlyWeekdayPatternFromDate,
  getRecurrenceSummary,
  getWeekdayFromDate,
} from "@/lib/recurrence";
import { parseLocalDate } from "@/lib/utils";
import { RecurrencePatternEditor } from "@/components/Calendar/RecurrencePatternEditor";

interface NewMeetingDialogProps {
  selectedDate: Date | null;
  onSave: (meeting: Meeting) => Promise<void> | void;
  trigger?: ReactNode;
}

const getFallbackDateValue = (selectedDate: Date | null) =>
  format(selectedDate ?? new Date(), "yyyy-MM-dd");

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

export const NewMeetingDialog = ({ selectedDate, onSave, trigger }: NewMeetingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getFallbackDateValue(selectedDate));
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
  const [monthlyRecurrenceMode, setMonthlyRecurrenceMode] = useState<MonthlyRecurrenceMode>("dayOfMonth");
  const [recurrenceMonthlyWeek, setRecurrenceMonthlyWeek] = useState<MonthlyRecurrenceWeek>(1);
  const [recurrenceMonthlyWeekday, setRecurrenceMonthlyWeekday] = useState<string>("Seg");
  const [recurrenceMonthlyRules, setRecurrenceMonthlyRules] = useState<MonthlyRecurrenceRule[]>([]);
  const requiresOnlineLink = meetingTypeRequiresOnlineLink(meetingType);

  useEffect(() => {
    if (!open) {
      const defaultDate = getFallbackDateValue(selectedDate);
      setDate(defaultDate);
      applyDateBasedDefaults(defaultDate);
    }
  }, [open, selectedDate]);

  const applyDateBasedDefaults = (dateValue: string) => {
    const defaults = buildDateBasedDefaults(dateValue);
    setRecurrenceDayOfMonth(defaults.recurrenceDayOfMonth);
    setRecurrenceDaysOfWeek([defaults.recurrenceWeekday]);
    setRecurrenceMonthlyWeek(defaults.recurrenceMonthlyWeek);
    setRecurrenceMonthlyWeekday(defaults.recurrenceMonthlyWeekday);
  };

  const resetForm = () => {
    const defaultDate = getFallbackDateValue(selectedDate);
    setTitle("");
    setDate(defaultDate);
    setTime("");
    setParticipants("");
    setDescription("");
    setDurationInput("");
    setMeetingType("presencial");
    setOnlineLink("");
    setIsRecurring(false);
    setRecurrenceType("weekly");
    setMonthlyRecurrenceMode("dayOfMonth");
    setRecurrenceMonthlyRules([]);
    applyDateBasedDefaults(defaultDate);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDurationBlur = () => {
    if (!durationInput.trim()) {
      return;
    }

    const parsed = parseDurationInput(durationInput);
    if (parsed) {
      setDurationInput(parsed.formatted);
    } else {
      toast.error("Informe a duração em minutos ou no formato HH:MM.");
    }
  };

  const toggleWeekDay = (day: string) => {
    setRecurrenceDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleRecurrenceTypeChange = (type: RecurrenceType) => {
    setRecurrenceType(type);
    const defaults = buildDateBasedDefaults(date);

    if (type === "weekly" && recurrenceDaysOfWeek.length === 0) {
      setRecurrenceDaysOfWeek([defaults.recurrenceWeekday]);
    }

    if (type === "monthly") {
      setRecurrenceDayOfMonth((current) => current || defaults.recurrenceDayOfMonth);
      setRecurrenceMonthlyWeek((current) => current || defaults.recurrenceMonthlyWeek);
      setRecurrenceMonthlyWeekday((current) => current || defaults.recurrenceMonthlyWeekday);
    }
  };

  const addMonthlyRule = (rule: MonthlyRecurrenceRule) => {
    setRecurrenceMonthlyRules((current) =>
      current.some((existingRule) => areMonthlyRecurrenceRulesEqual(existingRule, rule))
        ? current
        : [...current, rule],
    );
  };

  const removeMonthlyRule = (index: number) => {
    setRecurrenceMonthlyRules((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const recurrencePreview = useMemo(() => {
    if (!isRecurring) {
      return null;
    }

    if (recurrenceType === "monthly" && recurrenceMonthlyRules.length === 0) {
      return null;
    }

    const primaryMonthlyRule = recurrenceMonthlyRules[0] ?? null;

    return getRecurrenceSummary({
      date,
      isRecurring: true,
      recurrenceType,
      recurrenceDayOfMonth:
        recurrenceType === "monthly" && primaryMonthlyRule?.kind === "dayOfMonth"
          ? primaryMonthlyRule.dayOfMonth
          : null,
      recurrenceDaysOfWeek: recurrenceType === "weekly" ? recurrenceDaysOfWeek : null,
      recurrenceMonthlyWeek:
        recurrenceType === "monthly" && primaryMonthlyRule?.kind === "weekday"
          ? primaryMonthlyRule.week
          : null,
      recurrenceMonthlyWeekday:
        recurrenceType === "monthly" && primaryMonthlyRule?.kind === "weekday"
          ? primaryMonthlyRule.weekday
          : null,
      recurrenceMonthlyRules: recurrenceType === "monthly" ? recurrenceMonthlyRules : null,
    });
  }, [
    date,
    isRecurring,
    recurrenceDaysOfWeek,
    recurrenceMonthlyRules,
    recurrenceType,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (requiresOnlineLink && !onlineLink.trim()) {
      toast.error("Informe o link da reunião");
      return;
    }
    if (isRecurring && recurrenceType === "weekly" && recurrenceDaysOfWeek.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }
    if (isRecurring && recurrenceType === "monthly" && recurrenceMonthlyRules.length === 0) {
      toast.error("Adicione pelo menos uma regra mensal");
      return;
    }

    const parsedDuration = durationInput ? parseDurationInput(durationInput) : null;
    if (durationInput && !parsedDuration) {
      toast.error("Informe a duração em minutos ou no formato HH:MM.");
      return;
    }

    const participantsList = participants
      .split(",")
      .map((participant) => participant.trim())
      .filter((participant) => participant.length > 0);
    const primaryMonthlyRule = recurrenceMonthlyRules[0] ?? null;

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
      recurrenceDayOfMonth:
        isRecurring && recurrenceType === "monthly" && primaryMonthlyRule?.kind === "dayOfMonth"
          ? primaryMonthlyRule.dayOfMonth
          : null,
      recurrenceDaysOfWeek: isRecurring && recurrenceType === "weekly" ? recurrenceDaysOfWeek : null,
      recurrenceMonthlyWeek:
        isRecurring && recurrenceType === "monthly" && primaryMonthlyRule?.kind === "weekday"
          ? primaryMonthlyRule.week
          : null,
      recurrenceMonthlyWeekday:
        isRecurring && recurrenceType === "monthly" && primaryMonthlyRule?.kind === "weekday"
          ? primaryMonthlyRule.weekday
          : null,
      recurrenceMonthlyRules: isRecurring && recurrenceType === "monthly" ? recurrenceMonthlyRules : null,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setIsSubmitting(true);
    try {
      await onSave(meeting);
      resetForm();
      setOpen(false);
      toast.success("Solicitação enviada! Aguarde aprovação.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar a reunião.";
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
            Nova Reunião
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[min(98vw,680px)] max-h-[92vh] overflow-hidden border border-border/40 bg-background p-0 shadow-2xl rounded-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border/40 bg-background/95 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="absolute right-4 top-4">
            <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">Agendar Reunião</DialogTitle>
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
                <Calendar className="h-4 w-4" /> Reunião Única
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
                Título da Reunião *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reunião de planejamento"
                className="rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  {isRecurring ? "Data de Início *" : "Data *"}
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
                  Horário *
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
              <RecurrencePatternEditor
                startDate={date}
                recurrenceType={recurrenceType}
                onRecurrenceTypeChange={handleRecurrenceTypeChange}
                recurrenceDaysOfWeek={recurrenceDaysOfWeek}
                onToggleWeekDay={toggleWeekDay}
                monthlyRecurrenceMode={monthlyRecurrenceMode}
                onMonthlyRecurrenceModeChange={setMonthlyRecurrenceMode}
                recurrenceDayOfMonth={recurrenceDayOfMonth}
                onRecurrenceDayOfMonthChange={setRecurrenceDayOfMonth}
                recurrenceMonthlyWeek={recurrenceMonthlyWeek}
                onRecurrenceMonthlyWeekChange={setRecurrenceMonthlyWeek}
                recurrenceMonthlyWeekday={recurrenceMonthlyWeekday}
                onRecurrenceMonthlyWeekdayChange={setRecurrenceMonthlyWeekday}
                monthlyRecurrenceRules={recurrenceMonthlyRules}
                onAddMonthlyRule={addMonthlyRule}
                onRemoveMonthlyRule={removeMonthlyRule}
                recurrenceSummary={recurrencePreview}
                heading="Como essa reunião deve se repetir?"
                description="Escolha a frequência e depois a regra. O resumo final mostra exatamente o que será salvo."
              />
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
                placeholder="Tópicos a serem discutidos na reunião..."
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium">
                  <Timer className="h-4 w-4 text-primary" />
                  Duração
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
                  Tipo de reunião
                </Label>
                <Select value={meetingType} onValueChange={(value) => setMeetingType(value as MeetingType)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="external">Reunião Externa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {requiresOnlineLink && (
              <div className="space-y-2">
                <Label htmlFor="onlineLink" className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  Link da reunião ({getMeetingTypeLabel(meetingType)})
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
                      ? "Agendar Recorrência"
                      : "Confirmar Reunião"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
