import { format } from "date-fns";
import { Calendar, Check, RefreshCw } from "lucide-react";
import { cn, parseLocalDate } from "@/lib/utils";
import { MonthlyRecurrenceMode, MonthlyRecurrenceWeek, RecurrenceType } from "@/types/meeting";
import { MONTHLY_RECURRENCE_WEEKS, RECURRENCE_WEEKDAYS } from "@/lib/recurrence";

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

const RECURRENCE_TYPE_CONTENT: Record<
  RecurrenceType,
  { title: string; description: string; helper: string }
> = {
  daily: {
    title: "Diario",
    description: "A reuniao passa a aparecer todos os dias.",
    helper: "Use quando o compromisso se repete diariamente a partir da data inicial.",
  },
  weekly: {
    title: "Semanal",
    description: "Escolha um ou mais dias fixos da semana.",
    helper: "Bom para agendas como toda segunda e quinta, sempre no mesmo horario.",
  },
  monthly: {
    title: "Mensal",
    description: "Defina um dia do mes ou uma combinacao de semana + dia.",
    helper: "Ideal para regras como dia 15, 1a terca, 2a quinta ou ultima quinta.",
  },
};

const MONTHLY_MODE_CONTENT: Record<
  MonthlyRecurrenceMode,
  { title: string; description: string; example: string }
> = {
  dayOfMonth: {
    title: "Dia fixo do mes",
    description: "A reuniao acontece sempre no mesmo numero do calendario.",
    example: "Ex.: todo dia 15 do mes",
  },
  weekday: {
    title: "Semana + dia da semana",
    description: "A reuniao acontece por posicao dentro do mes.",
    example: "Ex.: 1a terca, 2a quinta ou ultima quinta",
  },
};

const LONG_WEEKDAY_LABELS: Record<string, string> = {
  Dom: "Domingo",
  Seg: "Segunda-feira",
  Ter: "Terca-feira",
  Qua: "Quarta-feira",
  Qui: "Quinta-feira",
  Sex: "Sexta-feira",
  Sab: "Sabado",
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
  recurrenceSummary,
  heading = "Como essa reuniao deve se repetir?",
  description = "Primeiro escolha a frequencia. Depois definimos a regra exata.",
}: RecurrencePatternEditorProps) => {
  const typeContent = RECURRENCE_TYPE_CONTENT[recurrenceType];
  const monthlyModeContent = MONTHLY_MODE_CONTENT[monthlyRecurrenceMode];
  const monthlyExample =
    monthlyRecurrenceMode === "dayOfMonth"
      ? `Todo mes no dia ${recurrenceDayOfMonth}`
      : `Todo mes na ${MONTHLY_WEEK_LABELS[recurrenceMonthlyWeek]} ${LONG_WEEKDAY_LABELS[recurrenceMonthlyWeekday] ?? recurrenceMonthlyWeekday}`;

  return (
    <section className="space-y-4 rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.98))] p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <span className="inline-flex w-fit rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
            Recorrencia
          </span>
          <h3 className="text-sm font-semibold text-slate-900">{heading}</h3>
          <p className="max-w-[34rem] text-xs leading-5 text-slate-500">{description}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-violet-500" />
          Inicio em {getStartDateLabel(startDate)}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {(Object.keys(RECURRENCE_TYPE_CONTENT) as RecurrenceType[]).map((type) => {
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
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Passo atual</p>
          <h4 className="text-sm font-semibold text-slate-900">{typeContent.title}</h4>
          <p className="text-xs leading-5 text-slate-500">{typeContent.helper}</p>
        </div>

        {recurrenceType === "daily" && (
          <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            A agenda sera criada todos os dias, sempre no mesmo horario, a partir de {getStartDateLabel(startDate)}.
          </div>
        )}

        {recurrenceType === "weekly" && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Escolha os dias</p>
                <p className="mt-1 text-xs text-slate-500">Voce pode marcar um ou varios dias da semana.</p>
              </div>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                Ex.: segunda e quinta
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {RECURRENCE_WEEKDAYS.map((day) => {
                const active = recurrenceDaysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onToggleWeekDay(day)}
                    className={cn(
                      "rounded-xl px-2 py-2.5 text-xs font-medium transition-all",
                      active
                        ? "border border-primary/30 bg-primary text-primary-foreground shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-slate-900",
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

            {monthlyRecurrenceMode === "dayOfMonth" && (
              <div className="space-y-3 rounded-[1.1rem] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Passo 2</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Escolha o dia do mes</p>
                  </div>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700">
                    {monthlyExample}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {MONTH_DAYS.map((day) => {
                    const active = recurrenceDayOfMonth === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => onRecurrenceDayOfMonthChange(day)}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
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
              <div className="space-y-3 rounded-[1.1rem] border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Passo 2</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Escolha a semana e o dia</p>
                  </div>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700">
                    {monthlyExample}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                              "rounded-xl px-3 py-2 text-xs font-medium transition-all",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
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
                              "rounded-xl px-3 py-2 text-xs font-medium transition-all",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white hover:text-slate-900",
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                Se essa frase descreve exatamente a regra que voce quer, a configuracao esta correta.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
