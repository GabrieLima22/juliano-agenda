import { Meeting } from "@/types/meeting";
import { Clock, Users, Timer, Video, MapPin, Link as LinkIcon } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
  onSelect?: (meeting: Meeting) => void;
}

export const MeetingCard = ({ meeting, onSelect }: MeetingCardProps) => {
  const isInteractive = typeof onSelect === "function";
  const isPending = meeting.status === "pending";
  const formattedTime = meeting.time?.slice(0, 5) ?? meeting.time;

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? () => onSelect?.(meeting) : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(meeting);
              }
            }
          : undefined
      }
      className={[
        "glass-effect rounded-2xl p-4 shadow-glass animate-fade-in-up animate-smooth transition-transform",
        isInteractive
          ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 hover:scale-[1.02] hover:bg-primary/5 hover:shadow-xl"
          : "",
      ]
        .join(" ")
        .trim()}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-lg gradient-text">{meeting.title}</h3>
        {isPending && (
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 via-amber-50 to-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm">
            <span className="block h-2 w-2 rounded-full bg-amber-500" />
            Aguardando confirmação
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>

        {typeof meeting.durationMinutes === "number" && meeting.durationMinutes > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>{meeting.durationMinutes} min</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {meeting.meetingType === "presencial" ? <MapPin className="h-4 w-4" /> : <Video className="h-4 w-4" />}
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
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">{meeting.description}</p>
        )}
      </div>
    </div>
  );
};