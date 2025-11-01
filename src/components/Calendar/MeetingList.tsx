import { Meeting } from "@/types/meeting";
import { MeetingCard } from "./MeetingCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface MeetingListProps {
  date: Date;
  meetings: Meeting[];
}

export const MeetingList = ({ date, meetings }: MeetingListProps) => {
  const formattedDate = format(date, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold capitalize">{formattedDate}</h2>
      </div>

      {meetings.length === 0 ? (
        <div className="glass-effect rounded-2xl p-8 text-center shadow-glass animate-fade-in">
          <p className="text-muted-foreground">Nenhuma reunião agendada para este dia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
};
