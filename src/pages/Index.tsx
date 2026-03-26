import { useEffect, useState } from "react";
import { addMonths, subMonths } from "date-fns";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminLoginDialog } from "@/components/Admin/AdminLoginDialog";
import { MeetingDetailsDialog } from "@/components/Admin/MeetingDetailsDialog";
import { AdminPanel } from "@/components/Admin/AdminPanel";
import { AdminToggle } from "@/components/Admin/AdminToggle";
import { CalendarGrid } from "@/components/Calendar/CalendarGrid";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { MeetingList } from "@/components/Calendar/MeetingList";
import { NewMeetingDialog } from "@/components/Calendar/NewMeetingDialog";
import { MobileAgendaView } from "@/components/Mobile/MobileAgendaView";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MeetingUpdatePayload,
  deleteMeeting,
  getMeetings,
  getMeetingsForDate,
  getPendingMeetings,
  saveMeeting,
  updateMeeting,
  updateMeetingStatus,
} from "@/lib/meetingStorage";
import { resolveApiBase } from "@/lib/runtime";
import { Meeting } from "@/types/meeting";

const Index = () => {
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDateMeetings, setSelectedDateMeetings] = useState<Meeting[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingForAdmin, setSelectedMeetingForAdmin] = useState<Meeting | null>(null);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);

  const apiBase = resolveApiBase();

  const loadMeetings = async () => {
    const allMeetings = await getMeetings();
    setMeetings(allMeetings);
  };

  const loadPendingMeetings = async () => {
    const pending = await getPendingMeetings();
    setPendingMeetings(pending);
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
    (async () => {
      if (!selectedDate) {
        return;
      }

      const dateMeetings = await getMeetingsForDate(selectedDate, isAdmin);
      setSelectedDateMeetings(dateMeetings);
    })();
  }, [selectedDate, meetings, isAdmin]);

  useEffect(() => {
    (async () => {
      if (isAdmin) {
        await loadPendingMeetings();
      }
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

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleAdminToggleClick = () => {
    if (isAdmin) {
      setShowAdminPanel((current) => !current);
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
    setShowAdminPanel(false);
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
    const confirmed = window.confirm(`Deseja realmente excluir a reuniao "${meeting.title}"?`);
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
          showAdminPanel={showAdminPanel}
          pendingMeetings={pendingMeetings}
          onPreviousMonth={handleMobilePreviousMonth}
          onNextMonth={handleMobileNextMonth}
          onDateClick={handleDateClick}
          onOpenMeetingDetails={handleMeetingSelect}
          onApproveMeeting={handleApproveMeeting}
          onRejectMeeting={handleRejectMeeting}
          onToggleAdminPanel={setShowAdminPanel}
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
        <div className="min-h-screen p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center animate-fade-in">
              <h1 className="gradient-text mb-3 text-5xl font-bold md:text-6xl">Agenda do Juliano</h1>
              <p className="text-lg text-muted-foreground">
                {isAdmin ? "Painel Administrativo" : "Gerencie todas as reunioes em um so lugar"}
              </p>
            </div>

            {isAdmin && (
              <div className="mb-8 flex flex-wrap justify-center gap-3 animate-fade-in sm:gap-4">
                <NewMeetingDialog selectedDate={selectedDate} onSave={handleSaveMeeting} />
                <Button
                  variant={showAdminPanel ? "outline" : "default"}
                  onClick={() => setShowAdminPanel(false)}
                  className={!showAdminPanel ? "gradient-primary text-white shadow-elegant" : ""}
                >
                  Calendario
                </Button>
                <Button
                  variant={showAdminPanel ? "default" : "outline"}
                  onClick={() => setShowAdminPanel(true)}
                  className={showAdminPanel ? "gradient-primary text-white shadow-elegant" : ""}
                >
                  Solicitacoes ({pendingMeetings.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-xl border-red-500/50 text-red-600 shadow-lg hover:scale-105 hover:border-red-500 hover:bg-red-500/10 animate-smooth"
                  title="Sair do modo administrador"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            )}

            {!isAdmin && !showAdminPanel && (
              <div className="mb-8 flex justify-center animate-fade-in">
                <NewMeetingDialog selectedDate={selectedDate} onSave={handleSaveMeeting} />
              </div>
            )}

            {showAdminPanel && isAdmin ? (
              <AdminPanel
                meetings={pendingMeetings}
                onApprove={handleApproveMeeting}
                onReject={handleRejectMeeting}
                onOpenDetails={handleMeetingSelect}
              />
            ) : (
              <>
                <CalendarHeader
                  currentMonth={currentMonth}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                />

                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <CalendarGrid
                      currentMonth={currentMonth}
                      meetings={meetings}
                      selectedDate={selectedDate}
                      onDateClick={handleDateClick}
                    />
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
      )}
    </div>
  );
};

export default Index;
