import {
  Activity,
  AlertCircle,
  Bell,
  Bookmark,
  Calendar,
  CalendarX2,
  CheckCircle2,
  Clock,
  Lock,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AgendaClosureSettings } from "@/types/agendaClosure";
import { formatAgendaClosureDate } from "@/lib/agendaClosure";

interface AgendaClosedScreenProps {
  closure: AgendaClosureSettings;
}

const bgIcons = [
  { Icon: Calendar, top: "12%", left: "10%", size: 32, delay: "0s", duration: "8s" },
  { Icon: Clock, top: "22%", left: "85%", size: 28, delay: "1.5s", duration: "10s" },
  { Icon: Lock, top: "75%", left: "8%", size: 24, delay: "2s", duration: "7s" },
  { Icon: Sparkles, top: "80%", left: "88%", size: 30, delay: "0.5s", duration: "9s" },
  { Icon: Bell, top: "45%", left: "90%", size: 22, delay: "3s", duration: "11s" },
  { Icon: Settings, top: "60%", left: "12%", size: 26, delay: "1s", duration: "8.5s" },
  { Icon: ShieldAlert, top: "10%", left: "70%", size: 28, delay: "2.5s", duration: "12s" },
  { Icon: Activity, top: "38%", left: "6%", size: 24, delay: "4s", duration: "9.5s" },
  { Icon: Bookmark, top: "85%", left: "48%", size: 20, delay: "1.8s", duration: "8s" },
];

export const AgendaClosedScreen = ({ closure }: AgendaClosedScreenProps) => {
  const description = closure.message?.trim()
    ? closure.message.trim()
    : "Sua agenda de atendimentos está bloqueada para novas marcações no momento.";

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-50/50 px-4 py-6 text-slate-700 sm:px-6 sm:py-8">
      <div className="absolute inset-x-0 top-0 z-10 h-2 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-500 shadow-md" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-tr from-fuchsia-200/40 via-indigo-100/30 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-cyan-100/40 via-fuchsia-100/30 to-transparent blur-[120px]" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bgIcons.map(({ Icon, top, left, size, delay, duration }, index) => (
          <div
            key={index}
            className="agenda-closed-float absolute text-slate-300/60"
            style={{ top, left, animationDelay: delay, animationDuration: duration }}
          >
            <Icon size={size} strokeWidth={1.2} />
          </div>
        ))}
      </div>

      <div className="relative z-20 flex h-full items-center justify-center overflow-hidden">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 to-indigo-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600 shadow-sm agenda-pulse-soft sm:text-xs">
            <AlertCircle size={14} className="text-fuchsia-500" />
            <span>Status da Agenda</span>
          </div>

          <div className="relative mb-8 flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
            <div className="agenda-orbit-slow absolute inset-0 rounded-full border border-dashed border-fuchsia-200" />
            <div className="agenda-orbit-fast absolute inset-4 rounded-full border border-indigo-100">
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400" />
              <div className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-pink-400" />
            </div>
            <div className="absolute h-24 w-24 rounded-[1.6rem] bg-gradient-to-tr from-fuchsia-100 to-pink-50 blur-xl opacity-80" />

            <div className="agenda-closed-float relative z-10 flex h-24 w-24 items-center justify-center rounded-[1.65rem] border border-slate-100 bg-gradient-to-tr from-white to-slate-50 shadow-[0_12px_24px_rgba(139,92,246,0.12)]">
              <CalendarX2 size={42} className="text-fuchsia-600" strokeWidth={1.2} />
              <div className="agenda-closed-float-reverse absolute -bottom-2 -right-2 rounded-xl border border-white bg-gradient-to-br from-pink-500 to-fuchsia-600 p-2.5 shadow-lg shadow-fuchsia-200">
                <Lock size={16} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <h1 className="mb-3.5 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Agenda Fechada
          </h1>

          <p className="mb-10 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-base">
            <span className="mb-1.5 block text-lg font-semibold text-slate-800">Olá, Juliano.</span>
            {description}
          </p>

          <div className="mb-10 w-full max-w-md rounded-[1.8rem] border border-slate-200/60 bg-white/50 p-5 shadow-sm backdrop-blur-md sm:p-6">
            <div className="mb-4 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 agenda-dot-ping" />
              Período de Bloqueio
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm">
                <div className="flex-shrink-0 rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-2.5 text-fuchsia-600">
                  <Calendar size={18} strokeWidth={2} />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400">Início</span>
                  <span className="text-sm font-bold text-slate-800">{formatAgendaClosureDate(closure.startsAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm">
                <div className="flex-shrink-0 rounded-xl border border-cyan-100 bg-cyan-50 p-2.5 text-cyan-600">
                  <Clock size={18} strokeWidth={2} />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400">Previsão de Retorno</span>
                  <span className="text-sm font-bold text-slate-800">{formatAgendaClosureDate(closure.endsAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-xs items-center justify-center gap-2 border-t border-slate-200/50 pt-6 text-xs text-slate-400">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>
              Gerenciado por <strong className="font-semibold text-fuchsia-600">Suellen (Administrativo)</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
