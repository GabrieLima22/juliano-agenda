import { Clock, ChevronDown, ChevronUp, Link as LinkIcon, MapPin, RefreshCw, Timer, Users, Video } from "lucide-react";
import { formatDuration } from "@/lib/duration";
import { Meeting, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import { getRecurrenceSummary } from "@/lib/recurrence";

interface MobileMeetingCardProps {
  meeting: Meeting;
  expanded: boolean;
  onToggle: () => void;
  onManage?: (meeting: Meeting) => void;
}

const getMeetingTone = (meeting: Meeting) => {
  if (meeting.status === "rejected") {
    return {
      bar: "bg-rose-400",
      title: "text-rose-700",
      badge: "bg-rose-100 text-rose-600",
      avatar: "from-rose-400 to-orange-300",
      border: "border-rose-200/85",
      ring: "ring-rose-200",
    };
  }

  if (meeting.status === "pending") {
    return {
      bar: "bg-amber-400",
      title: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      avatar: "from-amber-400 to-orange-300",
      border: "border-amber-200/85",
      ring: "ring-amber-200",
    };
  }

  switch (meeting.meetingType ?? "presencial") {
    case "zoom":
      return {
        bar: "bg-sky-500",
        title: "text-sky-700",
        badge: "bg-sky-100 text-sky-700",
        avatar: "from-sky-500 to-cyan-400",
        border: "border-sky-200/85",
        ring: "ring-sky-200",
      };
    case "meet":
      return {
        bar: "bg-indigo-500",
        title: "text-indigo-700",
        badge: "bg-indigo-100 text-indigo-700",
        avatar: "from-indigo-500 to-teal-400",
        border: "border-indigo-200/85",
        ring: "ring-indigo-200",
      };
    case "external":
      return {
        bar: "bg-blue-500",
        title: "text-blue-700",
        badge: "bg-blue-100 text-blue-700",
        avatar: "from-blue-500 to-cyan-400",
        border: "border-blue-200/85",
        ring: "ring-blue-200",
      };
    default:
      return {
        bar: "bg-emerald-400",
        title: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-700",
        avatar: "from-emerald-500 to-teal-400",
        border: "border-emerald-200/85",
        ring: "ring-emerald-200",
      };
  }
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

export const MobileMeetingCard = ({
  meeting,
  expanded,
  onToggle,
  onManage,
}: MobileMeetingCardProps) => {
  const tone = getMeetingTone(meeting);
  const meetingType = meeting.meetingType ?? "presencial";
  const hasOnlineLink = meetingTypeRequiresOnlineLink(meetingType) && Boolean(meeting.onlineLink);
  const participants = meeting.participants.slice(0, 3);
  const recurrenceSummary = getRecurrenceSummary(meeting);

  return (
    <article
      className={`relative cursor-pointer overflow-hidden rounded-[1.5rem] border bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 ${
        expanded
          ? `${tone.border} ring-2 ${tone.ring} shadow-md`
          : "border-white/60 hover:bg-white/80"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${tone.bar}`} />

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full appearance-none items-start justify-between gap-3 bg-transparent pl-2 text-left outline-none focus:outline-none focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 pr-4">
            <h3 className={`text-[15px] font-bold leading-tight ${tone.title}`}>
              {meeting.title}
            </h3>
            {meeting.isRecurring && (
              <RefreshCw className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-[0.95rem] w-[0.95rem]" />
              <span className="font-semibold text-slate-700">{meeting.time?.slice(0, 5) ?? meeting.time}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              {meetingTypeRequiresOnlineLink(meetingType) ? (
                <Video className="h-[0.95rem] w-[0.95rem]" />
              ) : (
                <MapPin className="h-[0.95rem] w-[0.95rem]" />
              )}
              <span>{getMeetingTypeLabel(meetingType)}</span>
            </span>
          </div>

          {meeting.isRecurring && recurrenceSummary && (
            <div className="mt-3 inline-flex items-start gap-1.5 rounded-xl border border-violet-200/70 bg-violet-50/80 px-3 py-2 text-[0.78rem] text-violet-700">
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{recurrenceSummary}</span>
            </div>
          )}
        </div>

        <span className="mt-0.5 text-slate-400 transition-colors duration-300 hover:text-slate-600">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden pl-2">
          <div className="border-t border-slate-200/70 pt-4">
            <p className="mb-3 text-sm leading-relaxed text-slate-600">
              {meeting.description || "Sem pauta cadastrada para esta reuniao."}
            </p>

            <div className="flex items-center justify-between gap-3">
              {participants.length > 0 ? (
                <div className="flex -space-x-2">
                  {participants.map((participant) => (
                    <span
                      key={participant}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${tone.avatar} text-[0.68rem] font-bold text-white shadow-sm`}
                    >
                      {getInitials(participant)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold ${tone.badge}`}>
                  Sem participantes
                </span>
              )}

              {typeof meeting.durationMinutes === "number" && meeting.durationMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-400">
                  <Timer className="h-[0.85rem] w-[0.85rem]" />
                  Duracao: {formatDuration(meeting.durationMinutes)}
                </span>
              )}
            </div>

            {(meeting.participants.length > 0 || hasOnlineLink || onManage || meeting.status !== "approved") && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {meeting.participants.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-slate-500">
                      <Users className="h-4 w-4" />
                      <span className="line-clamp-1">{meeting.participants.join(", ")}</span>
                    </span>
                  )}

                  {hasOnlineLink && (
                    <a
                      href={meeting.onlineLink!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[0.76rem] font-medium text-slate-600 transition duration-300 hover:text-slate-900"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Abrir link
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                {meeting.status !== "approved" && (
                  <span className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold ${tone.badge}`}>
                    {meeting.status === "pending" ? "Aguardando aprovacao" : "Recusada"}
                  </span>
                )}
                  {onManage && (
                    <button
                      type="button"
                      onClick={() => onManage(meeting)}
                      className="rounded-full bg-slate-800 px-3.5 py-1.5 text-[0.72rem] font-semibold text-white shadow-[0_16px_30px_-20px_rgba(15,23,42,0.7)] transition duration-300 active:scale-95"
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
