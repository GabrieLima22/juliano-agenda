import { ReactNode, startTransition, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Loader2,
  MapPin,
  Sun,
} from "lucide-react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminPanel } from "@/components/Admin/AdminPanel";
import { useMobileLiveContext } from "@/hooks/use-mobile-live-context";
import { Meeting } from "@/types/meeting";
import { MobileMeetingCard } from "./MobileMeetingCard";

type MobileTab = "agenda" | "notifications";

interface MobileAgendaViewProps {
  currentMonth: Date;
  selectedDate: Date | null;
  meetings: Meeting[];
  selectedDateMeetings: Meeting[];
  isAdmin: boolean;
  showAdminPanel: boolean;
  pendingMeetings: Meeting[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: Date) => void;
  onOpenMeetingDetails?: (meeting: Meeting) => void;
  onApproveMeeting: (id: string) => void;
  onRejectMeeting: (id: string) => void;
  onToggleAdminPanel: (show: boolean) => void;
  onLogout: () => void;
  newMeetingAction: ReactNode;
}

const BRAZIL_STATE_ABBREVIATIONS: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const normalizeValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Bom dia,";
  }
  if (hour < 18) {
    return "Boa tarde,";
  }
  return "Boa noite,";
};

const getWeatherVisual = (weatherCode: number | null, isDay: boolean) => {
  if (weatherCode === 0) {
    return {
      icon: isDay ? Sun : CloudSun,
      accent: "text-amber-500",
    };
  }

  if (weatherCode !== null && [1, 2, 3].includes(weatherCode)) {
    return {
      icon: CloudSun,
      accent: "text-teal-500",
    };
  }

  if (weatherCode !== null && [45, 48].includes(weatherCode)) {
    return {
      icon: CloudFog,
      accent: "text-slate-500",
    };
  }

  if (
    weatherCode !== null &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode)
  ) {
    return {
      icon: CloudRain,
      accent: "text-sky-500",
    };
  }

  if (weatherCode !== null && [71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return {
      icon: CloudSnow,
      accent: "text-cyan-500",
    };
  }

  return {
    icon: Cloud,
    accent: "text-slate-500",
  };
};

const formatWeekdayLabel = (date: Date) => WEEKDAY_LABELS[date.getDay()];

const formatWeekRange = (weekDays: Date[]) =>
  `${format(weekDays[0], "d", { locale: ptBR })} - ${format(weekDays[6], "d 'de' MMM", {
    locale: ptBR,
  })}`;

const formatSelectedHeading = (date: Date) => {
  const prefix = isToday(date) ? "Hoje, " : "";
  return `${prefix}${format(date, "d 'de' MMMM", { locale: ptBR })}`;
};

const formatLocationLabel = (city: string | null, region: string | null, fallback: string | null) => {
  if (city && region) {
    const abbreviation = BRAZIL_STATE_ABBREVIATIONS[normalizeValue(region)];
    return `${city}, ${abbreviation || region}`;
  }

  return fallback;
};

export const MobileAgendaView = ({
  currentMonth,
  selectedDate,
  meetings,
  selectedDateMeetings,
  isAdmin,
  showAdminPanel,
  pendingMeetings,
  onPreviousMonth,
  onNextMonth,
  onDateClick,
  onOpenMeetingDetails,
  onApproveMeeting,
  onRejectMeeting,
  onToggleAdminPanel,
  onLogout,
  newMeetingAction,
}: MobileAgendaViewProps) => {
  const [activeTab, setActiveTab] = useState<MobileTab>("agenda");
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [showMonthOverview, setShowMonthOverview] = useState(false);
  const liveContext = useMobileLiveContext(true);
  const referenceDate = selectedDate ?? currentMonth;
  const visibleMonth = showMonthOverview ? currentMonth : referenceDate;
  const weatherVisual = getWeatherVisual(liveContext.weatherCode, liveContext.isDay);
  const WeatherIcon = weatherVisual.icon;

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(referenceDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [referenceDate]);

  const monthDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentMonth));
    const gridEnd = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  useEffect(() => {
    setExpandedMeetingId(null);
  }, [selectedDateMeetings]);

  const getMeetingCountForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return meetings.filter((meeting) => meeting.date === dateKey && meeting.status !== "rejected").length;
  };

  const handleSelectDate = (date: Date) => {
    startTransition(() => {
      onDateClick(date);
      setShowMonthOverview(false);
      setExpandedMeetingId(null);
    });
  };

  const compactLocationLabel = formatLocationLabel(
    liveContext.city,
    liveContext.region,
    liveContext.locationLabel,
  );

  const locationCopy =
    compactLocationLabel ||
    (liveContext.permission === "denied"
      ? "Ative a localizacao"
      : liveContext.error || "Localizando aparelho...");

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 md:hidden" lang="pt-BR">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-sky-50 to-rose-50" />
      <div className="absolute -left-20 top-[-12%] h-[19rem] w-[19rem] rounded-full bg-teal-200/45 blur-[80px]" />
      <div className="absolute -right-20 top-[18%] h-[17rem] w-[17rem] rounded-full bg-indigo-200/38 blur-[82px]" />
      <div className="absolute bottom-[18%] left-[35%] h-[14rem] w-[14rem] rounded-full bg-rose-200/26 blur-[74px]" />
      <div className="absolute right-6 top-[calc(env(safe-area-inset-top)+1.4rem)] h-2.5 w-2.5 rounded-full bg-white/70 shadow-[inset_0_0_0_1px_rgba(100,116,139,0.18)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[28rem] flex-col px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1.35rem)]">
        <header className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.78rem] font-medium text-slate-500">{getGreeting()}</p>
            <h1 className="text-[2rem] font-bold tracking-[-0.05em] text-slate-900">Juliano</h1>
          </div>

          <div className="flex flex-col items-end">
            <button
              type="button"
              onClick={liveContext.refresh}
              className="inline-flex items-center gap-2 rounded-[1.15rem] border border-white/60 bg-white/42 px-3.5 py-2 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.34)] backdrop-blur-md transition duration-300 active:scale-[0.98]"
            >
              {liveContext.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <WeatherIcon className={`h-[1.125rem] w-[1.125rem] ${weatherVisual.accent}`} />
              )}
              <span className="text-[0.9rem] font-semibold text-slate-700">
                {typeof liveContext.temperature === "number"
                  ? `${Math.round(liveContext.temperature)}\u00B0C`
                  : "--"}
              </span>
            </button>
            <p className="mt-1 mr-1 max-w-[7.5rem] text-right text-[0.67rem] text-slate-500">{locationCopy}</p>
          </div>
        </header>

        {isAdmin && activeTab === "agenda" && (
          <div className="mt-5 self-start rounded-full border border-white/60 bg-white/44 p-1 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.32)] backdrop-blur-md">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleAdminPanel(false)}
                className={`rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold transition ${
                  !showAdminPanel ? "bg-slate-900 text-white" : "text-slate-500"
                }`}
              >
                Agenda
              </button>
              <button
                type="button"
                onClick={() => onToggleAdminPanel(true)}
                className={`rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold transition ${
                  showAdminPanel ? "bg-slate-900 text-white" : "text-slate-500"
                }`}
              >
                Pendentes {pendingMeetings.length > 0 ? `(${pendingMeetings.length})` : ""}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold text-slate-500 transition"
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {activeTab === "notifications" ? (
          <section className="mt-10 flex flex-1 flex-col justify-center pb-10">
            <div className="rounded-[1.8rem] border border-white/65 bg-white/58 p-6 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.32)] backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white shadow-[0_18px_34px_-26px_rgba(79,70,229,0.34)]">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="mt-5 text-center text-[1.3rem] font-semibold tracking-[-0.03em] text-slate-900">
                Notificacoes
              </h2>
              <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                Esta area fica pronta no mobile e recebe os avisos na proxima etapa.
              </p>
            </div>
          </section>
        ) : showAdminPanel && isAdmin ? (
          <div className="mt-8 flex-1 pb-6">
            <AdminPanel
              meetings={pendingMeetings}
              onApprove={onApproveMeeting}
              onReject={onRejectMeeting}
              onOpenDetails={onOpenMeetingDetails}
            />
          </div>
        ) : (
          <>
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold capitalize text-slate-900">
                    {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
                  </h2>
                  {!showMonthOverview && (
                    <p className="mt-1 text-[0.72rem] font-medium text-slate-500">
                      {formatWeekRange(weekDays)}
                    </p>
                  )}
                </div>

                {showMonthOverview ? (
                  <div className="flex items-center gap-1 rounded-full border border-white/60 bg-white/44 p-1 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.28)] backdrop-blur-md">
                    <button
                      type="button"
                      onClick={onPreviousMonth}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition active:scale-95"
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onNextMonth}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition active:scale-95"
                      aria-label="Proximo mes"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(() => setShowMonthOverview(false))}
                      className="pl-1 pr-2 text-[0.8rem] font-medium text-indigo-500"
                    >
                      Ver semana
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startTransition(() => setShowMonthOverview(true))}
                    className="text-sm font-medium text-indigo-500 transition hover:text-indigo-600"
                  >
                    Ver mes
                  </button>
                )}
              </div>

              {showMonthOverview ? (
                <div className="rounded-[1.7rem] border border-white/65 bg-white/46 p-4 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                  <div className="mb-3 grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(currentMonth), index)).map(
                      (date) => (
                        <span
                          key={`weekday-${date.toISOString()}`}
                          className="text-center text-[0.6rem] font-medium uppercase tracking-[0.16em] text-slate-400"
                        >
                          {formatWeekdayLabel(date)}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {monthDays.map((day) => {
                      const selected = isSameDay(day, referenceDate);
                      const isCurrentMonthDay = day.getMonth() === currentMonth.getMonth();
                      const eventCount = getMeetingCountForDate(day);

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => handleSelectDate(day)}
                          className={`relative flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-300 ${
                            selected
                              ? "bg-slate-900 text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.62)]"
                              : isCurrentMonthDay
                                ? "bg-white/68 text-slate-700"
                                : "bg-white/30 text-slate-300"
                          }`}
                        >
                          {format(day, "d")}
                          {eventCount > 0 && !selected && (
                            <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const selected = isSameDay(day, referenceDate);
                    const eventCount = getMeetingCountForDate(day);
                    const showTodayDot = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleSelectDate(day)}
                        className={`relative flex h-[4rem] w-full appearance-none flex-col items-center justify-center rounded-2xl border transition-all duration-300 focus:outline-none focus-visible:outline-none ${
                          selected
                            ? "scale-105 border-slate-800 bg-slate-800 text-white shadow-lg shadow-slate-800/20"
                            : "border-white/50 bg-white/40 text-slate-600 shadow-none hover:bg-white/60"
                        }`}
                      >
                        <span className="mb-1 text-[10px] font-medium uppercase tracking-wider opacity-80">
                          {formatWeekdayLabel(day)}
                        </span>
                        <span className={`text-base font-bold ${selected ? "text-white" : "text-slate-800"}`}>
                          {format(day, "d")}
                        </span>
                        {eventCount > 0 && !selected && (
                          <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        )}
                        {showTodayDot && selected && (
                          <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-indigo-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-8 flex-1">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[1.18rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {formatSelectedHeading(referenceDate)}
                  </h3>
                  <p className="mt-1 text-[0.72rem] font-medium text-slate-400">
                    {selectedDateMeetings.length > 0 ? "Compromissos do dia" : "Agenda vazia"}
                  </p>
                </div>

                <span className="rounded-full bg-indigo-100/95 px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-indigo-600">
                  {selectedDateMeetings.length} {selectedDateMeetings.length === 1 ? "evento" : "eventos"}
                </span>
              </div>

              {selectedDateMeetings.length === 0 ? (
                <div className="rounded-[1.8rem] border border-white/65 bg-white/58 p-6 text-center shadow-[0_20px_48px_-34px_rgba(15,23,42,0.3)] backdrop-blur-xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white shadow-[0_18px_34px_-28px_rgba(99,102,241,0.26)]">
                    <CalendarDays className="h-5 w-5 text-slate-500" />
                  </div>
                  <h4 className="mt-5 text-[1.08rem] font-semibold text-slate-900">Dia livre</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Nao existem reunioes cadastradas para esta data.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pb-24">
                  {selectedDateMeetings.map((meeting) => (
                    <MobileMeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      expanded={expandedMeetingId === meeting.id}
                      onToggle={() =>
                        setExpandedMeetingId((current) => (current === meeting.id ? null : meeting.id))
                      }
                      onManage={isAdmin ? onOpenMeetingDetails : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden">
        <div className="mx-auto max-w-[28rem] rounded-t-[2rem] border border-b-0 border-white/70 bg-white/84 px-9 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-4 shadow-[0_-18px_44px_-26px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => startTransition(() => setActiveTab("agenda"))}
              className={`flex w-[4.9rem] flex-col items-center gap-1 text-[0.62rem] font-medium transition ${
                activeTab === "agenda" ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              <CalendarDays className="h-[1.375rem] w-[1.375rem]" />
              <span>Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => startTransition(() => setActiveTab("notifications"))}
              className={`flex w-[4.9rem] flex-col items-center gap-1 text-[0.62rem] font-medium transition ${
                activeTab === "notifications" ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              <Bell className="h-[1.375rem] w-[1.375rem]" />
              <span>Notificacoes</span>
            </button>
          </div>

          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            {newMeetingAction}
          </div>
        </div>
      </nav>
    </div>
  );
};
