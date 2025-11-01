import { Meeting } from "@/types/meeting";
import { Clock, Users, Timer, Video, MapPin, Link as LinkIcon } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
}

export const MeetingCard = ({ meeting }: MeetingCardProps) => {
  return (
    <div className="glass-effect rounded-2xl p-4 shadow-glass animate-fade-in-up hover:scale-102 animate-smooth">
      <div className="mb-3">
        <h3 className="font-semibold text-lg gradient-text">{meeting.title}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{meeting.time}</span>
        </div>

        {typeof meeting.durationMinutes === "number" && meeting.durationMinutes > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>{meeting.durationMinutes} min</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {meeting.meetingType === "presencial" ? (
            <MapPin className="h-4 w-4" />
          ) : (
            <Video className="h-4 w-4" />
          )}
          <span className="capitalize">{meeting.meetingType === "meet" ? "Google Meet" : meeting.meetingType || "Presencial"}</span>
          {meeting.meetingType !== "presencial" && meeting.onlineLink && (
            <a
              href={meeting.onlineLink}
              target="_blank"
              rel="noreferrer"
              className="ml-1 inline-flex items-center gap-1 text-primary hover:underline"
              title="Abrir link da reunião"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link</span>
            </a>
          )}
        </div>
        
        {meeting.participants.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 mt-0.5" />
            <span>{meeting.participants.join(", ")}</span>
          </div>
        )}
        
        {meeting.description && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
            {meeting.description}
          </p>
        )}
      </div>
    </div>
  );
};
