import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, Users, FileText, Timer, Video, Link as LinkIcon, X } from "lucide-react";
import { Meeting } from "@/types/meeting";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseDurationInput } from "@/lib/duration";

interface NewMeetingDialogProps {
  selectedDate: Date | null;
  onSave: (meeting: Meeting) => void;
}

export const NewMeetingDialog = ({ selectedDate, onSave }: NewMeetingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
  const [time, setTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [meetingType, setMeetingType] = useState<"presencial" | "zoom" | "meet">("presencial");
  const [onlineLink, setOnlineLink] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (meetingType !== "presencial" && !onlineLink) {
      toast.error("Informe o link da reunião");
      return;
    }

    const parsedDuration = durationInput ? parseDurationInput(durationInput) : null;
    if (durationInput && !parsedDuration) {
      toast.error("Informe a duracao em minutos ou no formato HH:MM.");
      return;
    }

    const participantsList = participants
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const meeting: Meeting = {
      id: crypto.randomUUID(),
      title,
      date,
      time,
      participants: participantsList,
      description,
      durationMinutes: parsedDuration?.minutes,
      meetingType,
      onlineLink: meetingType === "presencial" ? null : onlineLink || null,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    onSave(meeting);

    // Reset
    setTitle("");
    setDate("");
    setTime("");
    setParticipants("");
    setDescription("");
    setDurationInput("");
    setMeetingType("presencial");
    setOnlineLink("");
    setOpen(false);

    toast.success("Solicitação enviada! Aguarde aprovação.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gradient-primary text-white shadow-elegant hover:scale-105 animate-smooth font-semibold rounded-2xl px-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Reunião
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-background border border-border/50 shadow-2xl w-[min(98vw,900px)] max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background/95 bg-gradient-to-r from-background via-primary/10 to-background backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border/50 px-6 py-4">
          <div className="absolute right-3 top-3">
            <DialogClose className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </div>
          <DialogTitle className="text-2xl gradient-text">Agendar Reunião</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 pb-36 space-y-5 overflow-y-auto max-h-[calc(92vh-80px)]">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Título da Reunião *
              </Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião de planejamento" className="rounded-xl" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Data *
                </Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Horário *
                </Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl" required />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="participants" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Participantes
              </Label>
              <Input id="participants" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Ex: João, Maria, Pedro (separados por vírgula)" className="rounded-xl" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Pauta
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tópicos a serem discutidos na reunião..." className="rounded-xl min-h-[96px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  Tempo de duração
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
                  Tipo de reunião
                </Label>
                <Select value={meetingType} onValueChange={(v) => setMeetingType(v as any)}>
                  <SelectTrigger className="rounded-xl">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="onlineLink" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  Link da reunião ({meetingType.toUpperCase()})
                </Label>
                <Input id="onlineLink" type="url" value={onlineLink} onChange={(e) => setOnlineLink(e.target.value)} placeholder={`Cole o link do ${meetingType}`} className="rounded-xl" />
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-t border-border/50 px-6 py-4 gap-3 sm:gap-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl">Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="gradient-primary text-white shadow-elegant hover:scale-105 animate-smooth font-semibold rounded-xl">Agendar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
