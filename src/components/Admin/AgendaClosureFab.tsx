import { Lock, Sparkles, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaClosureSettings } from "@/types/agendaClosure";
import {
  formatAgendaClosureDateTime,
  getAgendaClosureRemainingLabel,
  isAgendaClosureActive,
} from "@/lib/agendaClosure";

interface AgendaClosureFabProps {
  closure: AgendaClosureSettings | null;
  onOpenSettings: () => void;
  onReopen: () => void;
  reopening?: boolean;
}

export const AgendaClosureFab = ({
  closure,
  onOpenSettings,
  onReopen,
  reopening = false,
}: AgendaClosureFabProps) => {
  const isActive = isAgendaClosureActive(closure);
  const remainingLabel = getAgendaClosureRemainingLabel(closure);

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 md:bottom-6 md:right-6">
      {isActive && closure && (
        <div className="w-[min(24rem,calc(100vw-2rem))] rounded-[1.7rem] border border-fuchsia-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,245,255,0.96))] p-4 shadow-[0_28px_54px_-30px_rgba(91,33,182,0.42)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-[0_20px_34px_-20px_rgba(124,58,237,0.72)]">
              <Lock className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">Agenda fechada agora</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-600">
                  <Sparkles className="h-3 w-3" />
                  Restam {remainingLabel ?? "--"}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                De {formatAgendaClosureDateTime(closure.startsAt)} até {formatAgendaClosureDateTime(closure.endsAt)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenSettings}
                  className="rounded-xl border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
                >
                  Ajustar período
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onReopen}
                  disabled={reopening}
                  className="rounded-xl bg-slate-950 text-white hover:bg-slate-800"
                >
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  {reopening ? "Reabrindo..." : "Reabrir agenda"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isActive && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="group relative flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/70 bg-gradient-to-br from-slate-900 via-violet-700 to-cyan-500 text-white shadow-[0_30px_56px_-28px_rgba(124,58,237,0.72)] transition-transform duration-300 hover:-translate-y-1"
          title="Configurar bloqueio da agenda"
        >
          <span className="absolute inset-0 rounded-[1.6rem] bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="agenda-lock-glow absolute inset-[-10px] rounded-[1.9rem]" aria-hidden />
          <Lock className="relative z-10 h-6 w-6" />
        </button>
      )}
    </div>
  );
};
