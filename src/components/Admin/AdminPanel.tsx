import { Meeting, getMeetingTypeLabel, meetingTypeRequiresOnlineLink } from "@/types/meeting";
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Timer,
  Video,
  MapPin,
  Link as LinkIcon,
  Eye,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { formatDuration } from "@/lib/duration";
import { getRecurrenceSummary } from "@/lib/recurrence";

interface AdminPanelProps {
  meetings: Meeting[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenDetails?: (meeting: Meeting) => void;
}

export const AdminPanel = ({ meetings, onApprove, onReject, onOpenDetails }: AdminPanelProps) => {
  const fmtTime = (t: string | undefined) => (t ? String(t).slice(0, 5) : "");

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Solicitações Pendentes</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {meetings.length} {meetings.length === 1 ? "solicitação" : "solicitações"} aguardando
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-xl border border-white/70 bg-white/40 p-12 text-center backdrop-blur-sm">
          <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Todas as reuniões foram processadas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const meetingType = meeting.meetingType ?? "presencial";
            const hasOnlineLink = meetingTypeRequiresOnlineLink(meetingType) && Boolean(meeting.onlineLink);
            const recurrenceSummary = getRecurrenceSummary(meeting);

            return (
              <div
                key={meeting.id}
                className="rounded-[1.35rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.97))] p-5 shadow-[0_22px_34px_-30px_rgba(15,23,42,0.16)] backdrop-blur-md transition-colors hover:border-slate-300/85 hover:bg-white"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3.5">
                    <div className="flex flex-wrap items-start gap-2">
                      <h3 className="text-[1.02rem] font-semibold leading-tight text-slate-900">{meeting.title}</h3>
                      {meeting.isRecurring && recurrenceSummary && (
                        <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                          <RefreshCw className="h-3 w-3" />
                          Recorrente
                        </span>
                      )}
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                        Pendente
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 text-[13px] text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                        <Calendar className="h-3.5 w-3.5 text-violet-600" />
                        {format(parseLocalDate(meeting.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5 text-violet-600" />
                        {fmtTime(meeting.time)}
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

                    {(recurrenceSummary || meeting.participants.length > 0) && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {recurrenceSummary && (
                          <div className="rounded-2xl border border-violet-200/70 bg-violet-50/80 px-4 py-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500">
                              Recorrência
                            </p>
                            <div className="flex items-start gap-2 text-sm text-violet-700">
                              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>{recurrenceSummary}</span>
                            </div>
                          </div>
                        )}

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
                    )}

                    {hasOnlineLink && (
                      <a
                        href={meeting.onlineLink!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        Abrir link da reunião
                      </a>
                    )}

                    {meeting.description && (
                      <p className="border-t border-border/30 pt-3 text-sm leading-6 text-slate-600">
                        {meeting.description}
                      </p>
                    )}

                    <p className="text-xs text-slate-400">
                      Solicitado em {format(new Date(meeting.createdAt), "dd/MM/yyyy 'as' HH:mm")}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-[9.5rem] lg:flex-col">
                    {onOpenDetails && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDetails(meeting)}
                        className="rounded-xl border-slate-200 bg-white/80 text-xs text-slate-700 hover:bg-white"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Detalhes
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => onApprove(meeting.id)}
                      className="rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(meeting.id)}
                      className="rounded-xl border-red-200 text-xs text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Rejeitar
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
