import { useEffect, useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminLoginDialog } from "@/components/Admin/AdminLoginDialog";
import { MeetingDetailsDialog } from "@/components/Admin/MeetingDetailsDialog";
import { AdminPanel } from "@/components/Admin/AdminPanel";
import { RecurringMeetingsPanel } from "@/components/Admin/RecurringMeetingsPanel";
import { AdminToggle } from "@/components/Admin/AdminToggle";
import { CalendarGrid } from "@/components/Calendar/CalendarGrid";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { MeetingList } from "@/components/Calendar/MeetingList";
import { NewMeetingDialog } from "@/components/Calendar/NewMeetingDialog";
import { MobileAgendaView } from "@/components/Mobile/MobileAgendaView";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MeetingUpdatePayload,
  deleteMeeting,
  getMeetings,
  getPendingMeetings,
  saveMeeting,
  updateMeeting,
  updateMeetingStatus,
} from "@/lib/meetingStorage";
import { getMeetingsOccurringOnDate } from "@/lib/recurrence";
import { resolveApiBase } from "@/lib/runtime";
import { Meeting } from "@/types/meeting";

type AdminView = "calendar" | "pending" | "recurring";

const Index = () => {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>("calendar");
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingForAdmin, setSelectedMeetingForAdmin] = useState<Meeting | null>(null);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);

  const apiBase = resolveApiBase();

  const loadMeetings = async () => {
    try {
      const allMeetings = await getMeetings();
      setMeetings(allMeetings);
    } catch (error) {
      console.error("Failed to load meetings", error);
      setMeetings([]);
    }
  };

  const loadPendingMeetings = async () => {
    try {
      const pending = await getPendingMeetings();
      setPendingMeetings(pending);
    } catch (error) {
      console.error("Failed to load pending meetings", error);
      setPendingMeetings([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${apiBase}/auth.php`, { credentials: "include" });
        const data = await response.json().catch(() => ({ isAdmin: false }));
        setIsAdmin(Boolean(data?.isAdmin));
      } catch {
        // Mantem o calendario publico mesmo se a verificacao de sessao falhar.
      }

      await loadMeetings();
    })();
  }, [apiBase]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminView("calendar");
    }
  }, [isAdmin]);

  const recurringMeetings = useMemo(
    () =>
      meetings
        .filter((meeting) => meeting.isRecurring && meeting.status !== "rejected")
        .sort((a, b) => {
          const statusPriority = a.status.localeCompare(b.status);
          if (statusPriority !== 0) {
            return statusPriority;
          }

          const dateComparison = (a.date ?? "").localeCompare(b.date ?? "");
          if (dateComparison !== 0) {
            return dateComparison;
          }

          const timeComparison = (a.time ?? "").localeCompare(b.time ?? "");
          if (timeComparison !== 0) {
            return timeComparison;
          }

          return (a.title ?? "").localeCompare(b.title ?? "");
        }),
    [meetings],
  );

  const selectedDateMeetings = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    if (isAdmin) {
      return getMeetingsOccurringOnDate(meetings, selectedDate, {
        includePending: true,
        includeRejected: false,
      });
    }

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const approvedMeetings = getMeetingsOccurringOnDate(meetings, selectedDate, {
      approvedOnly: true,
    });
    const pendingDirectMeetings = meetings.filter(
      (meeting) => meeting.status === "pending" && meeting.date === dateKey,
    );

    return [...approvedMeetings, ...pendingDirectMeetings].sort((a, b) => {
      const timeComparison = (a.time ?? "").localeCompare(b.time ?? "");
      if (timeComparison !== 0) {
        return timeComparison;
      }

      return (a.title ?? "").localeCompare(b.title ?? "");
    });
  }, [isAdmin, meetings, selectedDate]);

  useEffect(() => {
    (async () => {
      if (isAdmin) {
        await loadPendingMeetings();
        return;
      }

      setPendingMeetings([]);
    })();
  }, [isAdmin, meetings]);

  const handlePreviousMonth = () => {
    setCurrentMonth((previousMonth) => subMonths(previousMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((previousMonth) => addMonths(previousMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(date);
  };

  const handleMobilePreviousMonth = () => {
    setCurrentMonth((previousMonth) => subMonths(previousMonth, 1));
  };

  const handleMobileNextMonth = () => {
    setCurrentMonth((previousMonth) => addMonths(previousMonth, 1));
  };

  const handleSaveMeeting = async (meeting: Meeting) => {
    await saveMeeting(meeting);
    await loadMeetings();
  };

  const handleAdminLogin = async () => {
    setIsAdmin(true);
    await loadMeetings();
    await loadPendingMeetings();
  };

  const handleAdminToggleClick = () => {
    if (isAdmin) {
      setAdminView((current) => (current === "calendar" ? "pending" : "calendar"));
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/auth.php?action=logout`, { method: "POST", credentials: "include" });
    } catch {
      // O estado local ainda deve ser limpo mesmo se o request falhar.
    }

    setIsAdmin(false);
    setAdminView("calendar");
    await loadMeetings();
    toast.success("Voce saiu do modo administrador.");
  };

  const handleMeetingSelect = (meeting: Meeting) => {
    setSelectedMeetingForAdmin(meeting);
    setShowMeetingDetails(true);
  };

  const handleMeetingDialogOpenChange = (open: boolean) => {
    setShowMeetingDetails(open);
    if (!open) {
      setSelectedMeetingForAdmin(null);
    }
  };

  const handleApproveMeeting = async (id: string) => {
    await updateMeetingStatus(id, "approved");
    await loadMeetings();
    await loadPendingMeetings();
    toast.success("Reuniao aprovada com sucesso.");
  };

  const handleRejectMeeting = async (id: string) => {
    await updateMeetingStatus(id, "rejected");
    await loadMeetings();
    await loadPendingMeetings();
    toast.success("Solicitacao rejeitada.");
  };

  const handleSaveMeetingChanges = async (changes: MeetingUpdatePayload) => {
    if (!changes?.id) {
      return;
    }

    setIsSavingMeeting(true);
    try {
      await updateMeeting(changes);
      await loadMeetings();
      if (isAdmin) {
        await loadPendingMeetings();
      }
      toast.success("Reuniao atualizada com sucesso.");
      setShowMeetingDetails(false);
      setSelectedMeetingForAdmin(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar a reuniao.";
      toast.error(message);
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    const confirmed = window.confirm(
      meeting.isRecurring
        ? `Deseja realmente excluir a serie recorrente "${meeting.title}"?`
        : `Deseja realmente excluir a reuniao "${meeting.title}"?`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingMeeting(true);
    try {
      await deleteMeeting(meeting.id);
      await loadMeetings();
      if (isAdmin) {
        await loadPendingMeetings();
      }
      toast.success("Reuniao excluida com sucesso.");
      setShowMeetingDetails(false);
      setSelectedMeetingForAdmin(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir a reuniao.";
      toast.error(message);
    } finally {
      setIsDeletingMeeting(false);
    }
  };

  return (
    <div className="min-h-screen" lang="pt-BR">
      <AdminToggle onClick={handleAdminToggleClick} />
      <AdminLoginDialog
        open={showAdminLogin}
        onOpenChange={setShowAdminLogin}
        onLogin={handleAdminLogin}
      />
      <MeetingDetailsDialog
        meeting={selectedMeetingForAdmin}
        open={showMeetingDetails && selectedMeetingForAdmin !== null}
        onOpenChange={handleMeetingDialogOpenChange}
        onSave={handleSaveMeetingChanges}
        onDelete={handleDeleteMeeting}
        saving={isSavingMeeting}
        deleting={isDeletingMeeting}
      />

      {isMobile ? (
        <MobileAgendaView
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          meetings={meetings}
          selectedDateMeetings={selectedDateMeetings}
          isAdmin={isAdmin}
          showAdminPanel={adminView === "pending"}
          pendingMeetings={pendingMeetings}
          onPreviousMonth={handleMobilePreviousMonth}
          onNextMonth={handleMobileNextMonth}
          onDateClick={handleDateClick}
          onOpenMeetingDetails={handleMeetingSelect}
          onApproveMeeting={handleApproveMeeting}
          onRejectMeeting={handleRejectMeeting}
          onToggleAdminPanel={(show) => setAdminView(show ? "pending" : "calendar")}
          onLogout={handleLogout}
          newMeetingAction={
            <NewMeetingDialog
              selectedDate={selectedDate}
              onSave={handleSaveMeeting}
              trigger={
                <button
                  type="button"
                  className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/90 bg-gradient-to-r from-indigo-500 to-teal-400 text-white shadow-[0_24px_46px_-18px_rgba(79,70,229,0.72)] transition duration-300 active:scale-95"
                  aria-label="Criar nova reuniao"
                >
                  <Plus className="h-6 w-6" />
                </button>
              }
            />
          }
        />
      ) : (
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none fixed inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(245,248,252,0.96)_46%,rgba(236,241,249,0.985))]" />
            <div className="absolute inset-0 opacity-22 [background-image:linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.54),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(255,255,255,0.4),transparent_24%),radial-gradient(circle_at_54%_82%,rgba(255,255,255,0.3),transparent_20%)]" />
            <div className="absolute inset-x-[14%] bottom-10 h-px bg-gradient-to-r from-transparent via-slate-200/65 to-transparent" />
            <div className="aurora-orb aurora-orb-emerald aurora-orb-slow -left-28 top-[-8%] h-[29rem] w-[29rem]" />
            <div className="aurora-orb aurora-orb-sky aurora-orb-medium right-[0%] top-[8%] h-[28rem] w-[28rem]" />
            <div className="aurora-orb aurora-orb-violet aurora-orb-medium right-[18%] bottom-[8%] h-[22rem] w-[22rem]" />
            <div className="aurora-orb aurora-orb-teal aurora-orb-fast left-[18%] bottom-[8%] h-[16rem] w-[16rem]" />
            <div className="absolute left-[8%] top-[18%] hidden xl:block h-[20rem] w-[20rem] aurora-ring aurora-ring-spin" />
            <div className="absolute right-[12%] top-[18%] hidden xl:block h-[22rem] w-[22rem] aurora-ring aurora-ring-spin-reverse" />
          </div>

          <div className="relative z-10 px-6 py-8 md:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 text-center animate-fade-in">
                <div className="inline-flex flex-col items-center gap-3">
                  <h1 className="px-1 pb-2 pt-1 text-5xl font-semibold leading-[1.08] tracking-[-0.065em] text-slate-900 md:text-6xl">
                    <span>Agenda do </span>
                    <span className="bg-[linear-gradient(135deg,rgba(67,56,202,1)_0%,rgba(59,130,246,0.96)_38%,rgba(124,58,237,0.9)_68%,rgba(45,212,191,0.82)_100%)] bg-clip-text text-transparent">
                      Juliano
                    </span>
                  </h1>
                  <span className="h-px w-28 bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
                </div>
              </div>

              {isAdmin && (
                <div className="mb-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <div className="flex rounded-[1.25rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,246,255,0.98))] p-1 shadow-[0_22px_34px_-26px_rgba(15,23,42,0.24)] backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => setAdminView("calendar")}
                      aria-pressed={adminView === "calendar"}
                      className={`rounded-[0.95rem] border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out ${
                        adminView === "calendar"
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.42)]"
                          : "border-slate-200/70 bg-white/62 text-slate-600 hover:border-slate-300/90 hover:bg-white/88 hover:text-slate-900"
                      }`}
                    >
                      Calendario
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminView("pending")}
                      aria-pressed={adminView === "pending"}
                      className={`rounded-[0.95rem] border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out ${
                        adminView === "pending"
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.42)]"
                          : "border-slate-200/70 bg-white/62 text-slate-600 hover:border-slate-300/90 hover:bg-white/88 hover:text-slate-900"
                      }`}
                    >
                      Solicitacoes
                      {pendingMeetings.length > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-full border border-white/45 bg-[linear-gradient(135deg,rgba(99,102,241,1),rgba(59,130,246,1))] px-1.5 text-[11px] font-bold text-white shadow-[0_12px_20px_-14px_rgba(79,70,229,0.54)]">
                          {pendingMeetings.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminView("recurring")}
                      aria-pressed={adminView === "recurring"}
                      className={`rounded-[0.95rem] border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out ${
                        adminView === "recurring"
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.42)]"
                          : "border-slate-200/70 bg-white/62 text-slate-600 hover:border-slate-300/90 hover:bg-white/88 hover:text-slate-900"
                      }`}
                    >
                      Recorrentes
                      {recurringMeetings.length > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-full border border-white/45 bg-[linear-gradient(135deg,rgba(124,58,237,1),rgba(99,102,241,1))] px-1.5 text-[11px] font-bold text-white shadow-[0_12px_20px_-14px_rgba(109,40,217,0.54)]">
                          {recurringMeetings.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-red-200/90 bg-white/88 text-red-500 shadow-[0_18px_28px_-24px_rgba(239,68,68,0.42)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600"
                    title="Sair do modo administrador"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>

                  <NewMeetingDialog selectedDate={selectedDate} onSave={handleSaveMeeting} />
                </div>
              )}

              {!isAdmin && adminView === "calendar" && (
                <div className="mb-8 flex justify-center animate-fade-in">
                  <NewMeetingDialog selectedDate={selectedDate} onSave={handleSaveMeeting} />
                </div>
              )}

              {adminView === "pending" && isAdmin ? (
                <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                  <AdminPanel
                    meetings={pendingMeetings}
                    onApprove={handleApproveMeeting}
                    onReject={handleRejectMeeting}
                    onOpenDetails={handleMeetingSelect}
                  />
                </div>
              ) : adminView === "recurring" && isAdmin ? (
                <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                  <RecurringMeetingsPanel
                    meetings={recurringMeetings}
                    onOpenDetails={handleMeetingSelect}
                    onDelete={handleDeleteMeeting}
                  />
                </div>
              ) : (
                <>
                  <CalendarHeader
                    currentMonth={currentMonth}
                    onPreviousMonth={handlePreviousMonth}
                    onNextMonth={handleNextMonth}
                  />

                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <div className="glass-effect rounded-[2rem] p-6 shadow-glass">
                        <CalendarGrid
                          currentMonth={currentMonth}
                          meetings={meetings}
                          selectedDate={selectedDate}
                          onDateClick={handleDateClick}
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      {selectedDate && (
                        <div className="sticky top-8 animate-slide-in-right">
                          <MeetingList
                            date={selectedDate}
                            meetings={selectedDateMeetings}
                            onMeetingSelect={isAdmin ? handleMeetingSelect : undefined}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
