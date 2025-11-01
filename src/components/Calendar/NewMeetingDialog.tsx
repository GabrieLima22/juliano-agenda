import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, Users, FileText, Timer, Video, Link as LinkIcon } from "lucide-react";
import { Meeting } from "@/types/meeting";
import { format } from "date-fns";
import { toast } from "sonner";

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
  const [description, setDescription] = useState(""); // Pauta
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [meetingType, setMeetingType] = useState<"presencial" | "zoom" | "meet">("presencial");
  const [onlineLink, setOnlineLink] = useState("");

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
      durationMinutes: typeof durationMinutes === "number" ? durationMinutes : undefined,
      meetingType,
      onlineLink: meetingType === "presencial" ? null : (onlineLink || null),
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    onSave(meeting);
    
    // Reset form
    setTitle("");
    setDate("");
    setTime("");
    setParticipants("");
    setDescription("");
    setDurationMinutes("");
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
      <DialogContent className="glass-effect border-none shadow-glass sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Agendar Reunião</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
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
                <Clock className="h-4 w-4" />
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

          <div className="space-y-2">
            <Label htmlFor="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes
            </Label>
            <Input
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Ex: João, Maria, Pedro (separados por vírgula)"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pauta
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tópicos a serem discutidos na reunião..."
              className="rounded-xl min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Tempo de duração (min)
              </Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
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
            <div className="space-y-2">
              <Label htmlFor="onlineLink" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link da reunião ({meetingType.toUpperCase()})
              </Label>
              <Input
                id="onlineLink"
                type="url"
                value={onlineLink}
                onChange={(e) => setOnlineLink(e.target.value)}
                placeholder={`Cole o link do ${meetingType}`}
                className="rounded-xl"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full gradient-primary text-white shadow-elegant hover:scale-105 animate-smooth font-semibold rounded-xl"
          >
            Agendar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
