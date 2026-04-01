import { format } from "date-fns";
import { Calendar, Check, Info, Plus, RefreshCw, Trash2 } from "lucide-react";
import { cn, parseLocalDate } from "@/lib/utils";
import {
  MonthlyRecurrenceMode,
  MonthlyRecurrenceRule,
  MonthlyRecurrenceWeek,
  RecurrenceType,
} from "@/types/meeting";
import {
  MONTHLY_RECURRENCE_WEEKS,
  RECURRENCE_WEEKDAYS,
  areMonthlyRecurrenceRulesEqual,
  formatMonthlyRecurrenceRule,
} from "@/lib/recurrence";

interface RecurrencePatternEditorProps {
  startDate: string;
  recurrenceType: RecurrenceType;
  onRecurrenceTypeChange: (type: RecurrenceType) => void;
  recurrenceDaysOfWeek: string[];
  onToggleWeekDay: (day: string) => void;
  monthlyRecurrenceMode: MonthlyRecurrenceMode;
  onMonthlyRecurrenceModeChange: (mode: MonthlyRecurrenceMode) => void;
  recurrenceDayOfMonth: number;
  onRecurrenceDayOfMonthChange: (day: number) => void;
  recurrenceMonthlyWeek: MonthlyRecurrenceWeek;
  onRecurrenceMonthlyWeekChange: (week: MonthlyRecurrenceWeek) => void;
  recurrenceMonthlyWeekday: string;
  onRecurrenceMonthlyWeekdayChange: (day: string) => void;
  monthlyRecurrenceRules: MonthlyRecurrenceRule[];
  onAddMonthlyRule: (rule: MonthlyRecurrenceRule) => void;
  onRemoveMonthlyRule: (index: number) => void;
  recurrenceSummary: string | null;
  heading?: string;
  description?: string;
}

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHLY_WEEK_LABELS: Record<MonthlyRecurrenceWeek, string> = {
  1: "1a",
  2: "2a",
  3: "3a",
  4: "4a",
  5: "5a",
  [-1]: "Ultima",
};

const EDITABLE_RECURRENCE_TYPES = ["weekly", "monthly"] as const;

const RECURRENCE_TYPE_CONTENT: Record<
  "weekly" | "monthly",
  { title: string; description: string; helper: string }
> = {
  weekly: {
    title: "Semanal",
    description: "Escolha um ou mais dias fixos da semana.",
    helper: "Bom para agendas como toda segunda e quinta, sempre no mesmo horario.",
  },
  monthly: {
    title: "Mensal",
    description: "Monte uma ou varias regras dentro do mesmo mes.",
    helper: "Ideal para combinacoes como 1a segunda, 3a quinta, dia 15 ou ultima quinta.",
  },
};

const MONTHLY_MODE_CONTENT: Record<
  MonthlyRecurrenceMode,
  { title: string; description: string; example: string }
> = {
  dayOfMonth: {
    title: "Dia fixo do mes",
    description: "A reuniao acontece sempre no mesmo numero do calendario.",
    example: "Ex.: dia 15 ou dia 31",
  },
  weekday: {
    title: "Semana + dia da semana",
    description: "A reuniao acontece por posicao dentro do mes.",
    example: "Ex.: 1a segunda, 3a quinta ou ultima quinta",
  },
};

const getStartDateLabel = (startDate: string) => {
  try {
    return format(parseLocalDate(startDate), "dd/MM/yyyy");
  } catch {
    return startDate;
  }
};

export const RecurrencePatternEditor = ({
  startDate,
  recurrenceType,
  onRecurrenceTypeChange,
  recurrenceDaysOfWeek,
  onToggleWeekDay,
  monthlyRecurrenceMode,
  onMonthlyRecurrenceModeChange,
  recurrenceDayOfMonth,
  onRecurrenceDayOfMonthChange,
  recurrenceMonthlyWeek,
  onRecurrenceMonthlyWeekChange,
  recurrenceMonthlyWeekday,
  onRecurrenceMonthlyWeekdayChange,
  monthlyRecurrenceRules,
  onAddMonthlyRule,
  onRemoveMonthlyRule,
  recurrenceSummary,
  heading = "Como essa reuniao deve se repetir?",
  description = "Primeiro escolha a frequencia. Depois definimos a regra exata.",
}: RecurrencePatternEditorProps) => {
  const typeContent =
    recurrenceType === "monthly" ? RECURRENCE_TYPE_CONTENT.monthly : RECURRENCE_TYPE_CONTENT.weekly;
  const monthlyModeContent = MONTHLY_MODE_CONTENT[monthlyRecurrenceMode];
  const weeklySelectionCount = recurrenceDaysOfWeek.length;
  const currentMonthlyRule: MonthlyRecurrenceRule =
    monthlyRecurrenceMode === "dayOfMonth"
      ? {
          kind: "dayOfMonth",
          dayOfMonth: recurrenceDayOfMonth,
        }
      : {
          kind: "weekday",
          week: recurrenceMonthlyWeek,
          weekday: recurrenceMonthlyWeekday,
        };
  const monthlyRuleAlreadyAdded = monthlyRecurrenceRules.some((rule) =>
    areMonthlyRecurrenceRulesEqual(rule, currentMonthlyRule),
  );

  return (
    <section className="space-y-4 rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <span className="inline-flex w-fit rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
            Recorrencia
          </span>
          <h3 className="text-sm font-semibold text-slate-900">{heading}</h3>
          <p className="max-w-[38rem] text-xs leading-5 text-slate-500">{description}</p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-violet-500" />
          Inicio em {getStartDateLabel(startDate)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {EDITABLE_RECURRENCE_TYPES.map((type) => {
          const active = recurrenceType === type;
          const content = RECURRENCE_TYPE_CONTENT[type];

          return (
            <button
              key={type}
              type="button"
              onClick={() => onRecurrenceTypeChange(type)}
              className={cn(
                "rounded-[1.15rem] border px-4 py-3 text-left transition-all duration-300",
                active
                  ? "border-violet-500/40 bg-[linear-gradient(135deg,rgba(124,58,237,0.98),rgba(99,102,241,0.94))] text-white shadow-[0_20px_30px_-24px_rgba(99,102,241,0.75)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("text-sm font-semibold", active ? "text-white" : "text-slate-900")}>
                    {content.title}
                  </p>
                  <p className={cn("mt-1 text-xs leading-5", active ? "text-white/85" : "text-slate-500")}>
                    {content.description}
                  </p>
                </div>
                {active && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/90 p-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Passo atual</p>
          <h4 className="text-sm font-semibold text-slate-900">{typeContent.title}</h4>
          <p className="text-xs leading-5 text-slate-500">{typeContent.helper}</p>
        </div>

        {recurrenceType === "weekly" && (
          <div className="mt-4 space-y-4 rounded-[1.15rem] border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Passo 2</p>
                <p className="text-sm font-semibold text-slate-900">Escolha os dias da semana</p>
                <p className="text-xs text-slate-500">Voce pode marcar um ou varios dias para a mesma reuniao.</p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                {weeklySelectionCount > 0
                  ? `${weeklySelectionCount} dia${weeklySelectionCount > 1 ? "s" : ""} selecionado${weeklySelectionCount > 1 ? "s" : ""}`
                  : "Selecione pelo menos 1 dia"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {RECURRENCE_WEEKDAYS.map((day) => {
                const active = recurrenceDaysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onToggleWeekDay(day)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-center text-xs font-medium transition-all",
                      active
                        ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {recurrenceType === "monthly" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.15rem] border border-violet-200/70 bg-[linear-gradient(180deg,rgba(245,243,255,0.82),rgba(255,255,255,0.96))] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-[0_16px_28px_-20px_rgba(109,40,217,0.55)]">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Monte as regras do mes</p>
                  <p className="text-xs leading-5 text-slate-600">
                    Cada regra adicionada cria mais uma ocorrencia da mesma reuniao dentro do mes.
                    Isso permite combinar padroes como 1a segunda e 3a quinta na mesma serie.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(MONTHLY_MODE_CONTENT) as MonthlyRecurrenceMode[]).map((mode) => {
                const active = monthlyRecurrenceMode === mode;
                const content = MONTHLY_MODE_CONTENT[mode];

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onMonthlyRecurrenceModeChange(mode)}
                    className={cn(
                      "rounded-[1.1rem] border px-4 py-3 text-left transition-all duration-300",
                      active
                        ? "border-violet-300 bg-violet-50 shadow-[0_18px_28px_-24px_rgba(109,40,217,0.35)]"
                        : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{content.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{content.description}</p>
                        <p className="mt-2 text-[11px] font-medium text-violet-600">{content.example}</p>
                      </div>
                      {active && (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 rounded-[1.15rem] border border-slate-200 bg-white p-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Passo 2</p>
                <p className="text-sm font-semibold text-slate-900">Configure a proxima regra mensal</p>
                <p className="text-xs text-slate-500">{monthlyModeContent.description}</p>
              </div>

              {monthlyRecurrenceMode === "dayOfMonth" && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs text-slate-600">
                      Escolha um dia do calendario. Se ele nao existir em um mes menor, a reuniao nao acontece naquele mes.
                    </p>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
                    {MONTH_DAYS.map((day) => {
                      const active = recurrenceDayOfMonth === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => onRecurrenceDayOfMonthChange(day)}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition-all",
                            active
                              ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {monthlyRecurrenceMode === "weekday" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Semana do mes</p>
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHLY_RECURRENCE_WEEKS.map((week) => {
                        const active = recurrenceMonthlyWeek === week;
                        return (
                          <button
                            key={week}
                            type="button"
                            onClick={() => onRecurrenceMonthlyWeekChange(week)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                              active
                                ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
                            )}
                          >
                            {MONTHLY_WEEK_LABELS[week]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dia da semana</p>
                    <div className="grid grid-cols-4 gap-2">
                      {RECURRENCE_WEEKDAYS.map((day) => {
                        const active = recurrenceMonthlyWeekday === day;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => onRecurrenceMonthlyWeekdayChange(day)}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                              active
                                ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 rounded-[1.05rem] border border-violet-200 bg-violet-50/70 p-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                    Regra atual
                  </p>
                  <p className="mt-1 text-sm font-semibold text-violet-900">
                    Todo mes em {formatMonthlyRecurrenceRule(currentMonthlyRule)}
                  </p>
                  <p className="mt-1 text-xs text-violet-700/80">
                    {monthlyRuleAlreadyAdded
                      ? "Essa regra ja foi adicionada."
                      : "Use o botao ao lado para incluir essa regra na serie."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAddMonthlyRule(currentMonthlyRule)}
                  disabled={monthlyRuleAlreadyAdded}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                    monthlyRuleAlreadyAdded
                      ? "cursor-not-allowed border border-slate-200 bg-white text-slate-400"
                      : "border border-violet-300 bg-violet-600 text-white shadow-[0_16px_28px_-22px_rgba(109,40,217,0.5)] hover:bg-violet-700",
                  )}
                >
                  <Plus className="h-4 w-4" />
                  {monthlyRuleAlreadyAdded ? "Ja adicionada" : "Adicionar regra"}
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.15rem] border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Passo 3</p>
                  <p className="text-sm font-semibold text-slate-900">Regras adicionadas</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                  {monthlyRecurrenceRules.length} regra{monthlyRecurrenceRules.length === 1 ? "" : "s"} ativa
                  {monthlyRecurrenceRules.length === 1 ? "" : "s"}
                </span>
              </div>

              {monthlyRecurrenceRules.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 text-center text-sm text-slate-500">
                  Nenhuma regra mensal adicionada ainda.
                </div>
              ) : (
                <div className="grid gap-3">
                  {monthlyRecurrenceRules.map((rule, index) => (
                    <div
                      key={`${rule.kind}-${index}`}
                      className="flex flex-col gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Todo mes em {formatMonthlyRecurrenceRule(rule)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Essa ocorrencia faz parte da mesma serie da reuniao.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveMonthlyRule(index)}
                        className="inline-flex items-center gap-2 self-start rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 md:self-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.15rem] border border-amber-200/70 bg-amber-50/85 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                  <Info className="h-4 w-4" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Como a regra se comporta</p>
                  <p className="text-xs leading-5 text-slate-600">
                    Se voce escolher o dia 31, a reuniao so acontece nos meses que tiverem dia 31.
                    Nos meses com 30 dias ou fevereiro, ela nao aparece.
                  </p>
                  <p className="text-xs leading-5 text-slate-600">
                    Se voce escolher a 5a ocorrencia de um dia e aquele mes nao tiver essa 5a ocorrencia,
                    a reuniao nao acontece naquele mes. Para sempre pegar a ultima, use a opcao Ultima.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {recurrenceSummary && (
        <div className="rounded-[1.2rem] border border-violet-200/80 bg-[linear-gradient(180deg,rgba(245,243,255,0.98),rgba(255,255,255,0.98))] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-[0_16px_28px_-20px_rgba(109,40,217,0.6)]">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">Resumo final</p>
              <p className="mt-1 text-sm font-semibold text-violet-900">{recurrenceSummary}</p>
              <p className="mt-1 text-xs leading-5 text-violet-700/80">
                Se essa frase descreve exatamente a regra desejada, a configuracao esta pronta.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
