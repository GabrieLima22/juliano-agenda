import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Eye, RefreshCw, Timer, Trash2, Users, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meeting, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import { formatDuration } from "@/lib/duration";
import { parseLocalDate } from "@/lib/utils";
import { getRecurrenceSummary } from "@/lib/recurrence";

interface RecurringMeetingsPanelProps {
  meetings: Meeting[];
  onOpenDetails?: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

const statusMap = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
} as const;

const statusLabelMap = {
  approved: "Aprovada",
  pending: "Pendente",
  rejected: "Rejeitada",
} as const;

export const RecurringMeetingsPanel = ({
  meetings,
  onOpenDetails,
  onDelete,
}: RecurringMeetingsPanelProps) => {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Reuniões Recorrentes</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {meetings.length} {meetings.length === 1 ? "série recorrente ativa" : "séries recorrentes ativas"}
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-white/70 bg-white/45 p-12 text-center backdrop-blur-sm">
          <RefreshCw className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma recorrência ativa</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Quando houver séries recorrentes, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const recurrenceSummary = getRecurrenceSummary(meeting);
            const meetingType = meeting.meetingType ?? "presencial";
            const statusTone = statusMap[meeting.status];
            const statusLabel = statusLabelMap[meeting.status];

            return (
              <div
                key={meeting.id}
                className="rounded-[1.35rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.97))] p-5 shadow-[0_22px_34px_-30px_rgba(15,23,42,0.16)] backdrop-blur-md transition-colors hover:border-slate-300/85 hover:bg-white"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3.5">
                    <div className="flex flex-wrap items-start gap-2">
                      <h3 className="text-[1.02rem] font-semibold leading-tight text-slate-900">{meeting.title}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                        <RefreshCw className="h-3 w-3" />
                        Recorrente
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {recurrenceSummary && (
                      <div className="rounded-2xl border border-violet-200/70 bg-violet-50/80 px-4 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500">
                          Regra atual
                        </p>
                        <div className="flex items-start gap-2 text-sm text-violet-700">
                          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{recurrenceSummary}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2.5 text-[13px] text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                        <Calendar className="h-3.5 w-3.5 text-violet-600" />
                        Início em {format(parseLocalDate(meeting.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5 text-violet-600" />
                        {meeting.time?.slice(0, 5) ?? meeting.time}
                      </span>
                      {typeof meeting.durationMinutes === "number" && meeting.durationMinutes > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                          <Timer className="h-3.5 w-3.5 text-violet-600" />
                          {formatDuration(meeting.durationMinutes)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                        {meetingTypeRequiresOnlineLink(meetingType) ? (
                          <Video className="h-3.5 w-3.5 text-violet-600" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-violet-600" />
                        )}
                        {getMeetingTypeLabel(meetingType)}
                      </span>
                    </div>

                    {meeting.participants.length > 0 && (
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Participantes
                        </p>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Users className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                          <span className="line-clamp-2">{meeting.participants.join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-[10rem] lg:flex-col">
                    {onOpenDetails && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDetails(meeting)}
                        className="rounded-xl border-slate-200 bg-white/80 text-xs text-slate-700 hover:bg-white"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Detalhes
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(meeting)}
                      className="rounded-xl border-red-200 text-xs text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Remover série
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
