import { Meeting } from "@/types/meeting";
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Video,
  MapPin,
  Link as LinkIcon,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { parseLocalDate } from "@/lib/utils";
import { formatDuration } from "@/lib/duration";

interface AdminPanelProps {
  meetings: Meeting[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenDetails?: (meeting: Meeting) => void;
}

export const AdminPanel = ({ meetings, onApprove, onReject, onOpenDetails }: AdminPanelProps) => {
  const fmtTime = (t: string | undefined) => (t ? String(t).slice(0, 5) : "");
  return (
    <div className="glass-effect rounded-3xl p-6 shadow-glass animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold gradient-text">solicitações Pendentes</h2>
          <p className="text-sm text-muted-foreground">
            {meetings.length} {meetings.length === 1 ? "solicitação" : "solicitações"} aguardando aprovação
          </p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground text-lg">Nenhuma solicitação pendente</p>
          <p className="text-sm text-muted-foreground mt-2">Todas as reunies foram processadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-background/50 rounded-2xl p-5 border border-border/50 hover:border-primary/30 animate-smooth"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-xl gradient-text">{meeting.title}</h3>
                    <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      Pendente
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(parseLocalDate(meeting.date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{fmtTime(meeting.time)}</span>
                    </div>
                  </div>

                  {/* Extra info: duração e tipo/link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {typeof meeting.durationMinutes === "number" && meeting.durationMinutes > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Duração:</span>
                        <span className="font-medium">{formatDuration(meeting.durationMinutes)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      {meeting.meetingType === "presencial" ? (
                        <MapPin className="h-4 w-4 text-primary" />
                      ) : (
                        <Video className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium capitalize">
                        {meeting.meetingType === "meet" ? "Google Meet" : meeting.meetingType || "Presencial"}
                      </span>
                      {meeting.meetingType !== "presencial" && meeting.onlineLink && (
                        <a
                          href={meeting.onlineLink}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
                          title="Abrir link da reunio"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {meeting.participants.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-muted-foreground">Participantes:</p>
                        <p className="text-foreground">{meeting.participants.join(", ")}</p>
                      </div>
                    </div>
                  )}

                  {meeting.description && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {meeting.description}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2">
                    Solicitado em {format(new Date(meeting.createdAt), "dd/MM/yyyy 'ás' HH:mm")}
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-col gap-2 justify-end">
                  {onOpenDetails && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenDetails(meeting)}
                      className="rounded-xl border-primary/40 text-primary hover:bg-primary/10 shadow-lg hover:scale-105 animate-smooth flex-1 md:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                  )}
                  <Button
                    onClick={() => onApprove(meeting.id)}
                    className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:scale-105 animate-smooth rounded-xl flex-1 md:flex-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => onReject(meeting.id)}
                    variant="outline"
                    className="border-red-500/50 text-red-600 hover:bg-red-500/10 hover:border-red-500 shadow-lg hover:scale-105 animate-smooth rounded-xl flex-1 md:flex-none"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
