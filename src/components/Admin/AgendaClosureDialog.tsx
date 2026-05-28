import { useEffect, useState } from "react";
import { Calendar, Clock3, Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgendaClosurePayload, AgendaClosureSettings } from "@/types/agendaClosure";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/agendaClosure";

interface AgendaClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: AgendaClosureSettings | null;
  saving?: boolean;
  onSave: (payload: AgendaClosurePayload) => Promise<void> | void;
}

export const AgendaClosureDialog = ({
  open,
  onOpenChange,
  value,
  saving = false,
  onSave,
}: AgendaClosureDialogProps) => {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setStartsAt(toDateTimeLocalValue(value?.startsAt));
    setEndsAt(toDateTimeLocalValue(value?.endsAt));
    setMessage(value?.message ?? "");
  }, [open, value]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!startsAt || !endsAt) {
      window.alert("Selecione o início e o fim do bloqueio.");
      return;
    }

    await onSave({
      startsAt: fromDateTimeLocalValue(startsAt),
      endsAt: fromDateTimeLocalValue(endsAt),
      message: message.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,640px)] overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,248,255,0.98))] p-0 shadow-[0_34px_90px_-38px_rgba(76,29,149,0.34)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400" />
        <div className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-fuchsia-100/55 blur-3xl" />
        <div className="absolute -right-12 bottom-8 h-36 w-36 rounded-full bg-cyan-100/55 blur-3xl" />

        <form onSubmit={handleSubmit} className="relative z-10">
          <DialogHeader className="px-6 pb-5 pt-7 sm:px-8">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600 shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              Bloqueio da agenda
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">
              Defina um período de fechamento
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-500">
              Durante esse período, visitantes verão a tela de agenda fechada. O acesso do administrativo continua liberado.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 sm:px-8">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agenda-closure-start" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="h-4 w-4 text-fuchsia-500" />
                    Início do bloqueio
                  </Label>
                  <Input
                    id="agenda-closure-start"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-white/90"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agenda-closure-end" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock3 className="h-4 w-4 text-cyan-500" />
                    Fim do bloqueio
                  </Label>
                  <Input
                    id="agenda-closure-end"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-white/90"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda-closure-message" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Texto complementar
                </Label>
                <Textarea
                  id="agenda-closure-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Opcional: adicione um detalhe rápido para o período fechado."
                  className="min-h-[128px] rounded-[1.4rem] border-slate-200 bg-white/90 text-sm leading-6"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200/70 bg-white/72 px-6 py-4 backdrop-blur-sm sm:px-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-200 bg-white/80 text-slate-600"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 text-white shadow-[0_18px_32px_-18px_rgba(15,23,42,0.62)] hover:bg-slate-800"
            >
              {saving ? "Salvando..." : "Salvar bloqueio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
