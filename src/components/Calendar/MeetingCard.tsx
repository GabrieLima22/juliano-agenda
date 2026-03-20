import { Meeting, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import { Clock, Users, Timer, Video, MapPin, Link as LinkIcon } from "lucide-react";
import { formatDuration } from "@/lib/duration";
import { cn } from "@/lib/utils";

interface MeetingCardProps {
  meeting: Meeting;
  onSelect?: (meeting: Meeting) => void;
}

export const MeetingCard = ({ meeting, onSelect }: MeetingCardProps) => {
  const isInteractive = typeof onSelect === "function";
  const isPending = meeting.status === "pending";
  const isRejected = meeting.status === "rejected";
  const formattedTime = meeting.time?.slice(0, 5) ?? meeting.time;
  const meetingType = meeting.meetingType ?? "presencial";
  const hasOnlineLink = meetingTypeRequiresOnlineLink(meetingType) && Boolean(meeting.onlineLink);
  const statusBadge = isPending
    ? {
        label: "Aguardando confirma\u00E7\u00E3o",
        className:
          "border-amber-300 bg-gradient-to-r from-amber-100 via-amber-50 to-white text-amber-700",
        dotClassName: "bg-amber-500",
      }
    : isRejected
      ? {
          label: "Recusada",
          className: "border-red-300 bg-gradient-to-r from-red-100 via-red-50 to-white text-red-700",
          dotClassName: "bg-red-500",
        }
      : null;

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
      className={cn(
        "glass-effect rounded-2xl border p-4 shadow-glass animate-fade-in-up animate-smooth transition-transform",
        isRejected ? "border-red-500/40 bg-red-500/5" : "border-border/50",
        isPending && "border-amber-400/40 bg-amber-500/5",
        isInteractive &&
          "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 hover:scale-[1.02] hover:bg-primary/5 hover:shadow-xl",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-lg gradient-text">{meeting.title}</h3>
        {statusBadge && (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide shadow-sm",
              statusBadge.className,
            )}
          >
            <span className={cn("block h-2 w-2 rounded-full", statusBadge.dotClassName)} />
            {statusBadge.label}
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
            <span>{formatDuration(meeting.durationMinutes)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {meetingTypeRequiresOnlineLink(meetingType) ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
          <span>{getMeetingTypeLabel(meetingType)}</span>
          {hasOnlineLink && (
            <a
              href={meeting.onlineLink!}
              target="_blank"
              rel="noreferrer"
              className="ml-1 inline-flex items-center gap-1 text-primary hover:underline"
              title="Abrir link da reuni\u00E3o"
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
