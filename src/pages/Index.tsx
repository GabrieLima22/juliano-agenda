﻿import { useState, useEffect } from "react";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { CalendarGrid } from "@/components/Calendar/CalendarGrid";
import { MeetingList } from "@/components/Calendar/MeetingList";
import { NewMeetingDialog } from "@/components/Calendar/NewMeetingDialog";
import { AdminToggle } from "@/components/Admin/AdminToggle";
import { AdminLoginDialog } from "@/components/Admin/AdminLoginDialog";
import { AdminPanel } from "@/components/Admin/AdminPanel";
import { MeetingDetailsDialog } from "@/components/Admin/MeetingDetailsDialog";
import {
  getMeetings,
  getMeetingsForDate,
  saveMeeting,
  getPendingMeetings,
  updateMeetingStatus,
  deleteMeeting,
  updateMeeting,
  MeetingUpdatePayload,
} from "@/lib/meetingStorage";
import { Meeting } from "@/types/meeting";
import { addMonths, subMonths } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
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

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE || "http://localhost/juliano-agenda/api";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth.php`, { credentials: "include" });
        const data = await res.json().catch(() => ({ isAdmin: false }));
        setIsAdmin(Boolean(data?.isAdmin));
      } catch {}
      await loadMeetings();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (selectedDate) {
        const dateMeetings = await getMeetingsForDate(selectedDate, isAdmin);
        setSelectedDateMeetings(dateMeetings);
      }
    })();
  }, [selectedDate, meetings, isAdmin]);

  useEffect(() => {
    (async () => {
      if (isAdmin) {
        await loadPendingMeetings();
      }
    })();
  }, [isAdmin, meetings]);

  const loadMeetings = async () => {
    const allMeetings = await getMeetings();
    setMeetings(allMeetings);
  };

  const loadPendingMeetings = async () => {
    const pending = await getPendingMeetings();
    setPendingMeetings(pending);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
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
      setShowAdminPanel(!showAdminPanel);
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth.php?action=logout`, { method: "POST", credentials: "include" });
    } catch {}
    setIsAdmin(false);
    setShowAdminPanel(false);
    toast.success("Você saiu do modo administrador.");
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
    toast.success("reunião aprovada com sucesso!");
  };

  const handleRejectMeeting = async (id: string) => {
    await updateMeetingStatus(id, "rejected");
    await loadMeetings();
    await loadPendingMeetings();
    toast.success("Solicitação rejeitada.");
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
      toast.success("reunião atualizada com sucesso!");
      setShowMeetingDetails(false);
      setSelectedMeetingForAdmin(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar a reunião.";
      toast.error(message);
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    const confirmed = window.confirm(`Deseja realmente excluir a reunião "${meeting.title}"?`);
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
      toast.success("reunião excluída com sucesso.");
      setShowMeetingDetails(false);
      setSelectedMeetingForAdmin(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir a reunião.";
      toast.error(message);
    } finally {
      setIsDeletingMeeting(false);
    }
  };
  return (
    <div className="min-h-screen p-4 md:p-8" lang="pt-BR">
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-3">
            Agenda do Juliano
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAdmin ? "Painel Administrativo" : "Gerencie todas as reuniões em um só lugar"}
          </p>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 animate-fade-in">
            <NewMeetingDialog selectedDate={selectedDate} onSave={handleSaveMeeting} />
            <Button
              variant={showAdminPanel ? "outline" : "default"}
              onClick={() => setShowAdminPanel(false)}
              className={!showAdminPanel ? "gradient-primary text-white shadow-elegant" : ""}
            >
              Calendário
            </Button>
            <Button
              variant={showAdminPanel ? "default" : "outline"}
              onClick={() => setShowAdminPanel(true)}
              className={showAdminPanel ? "gradient-primary text-white shadow-elegant" : ""}
            >
              Solicitações ({pendingMeetings.length})
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-500/50 text-red-600 hover:bg-red-500/10 hover:border-red-500 shadow-lg hover:scale-105 animate-smooth rounded-xl"
              title="Sair do modo administrador"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        )}

        {/* Action Button */}
        {!isAdmin && !showAdminPanel && (
          <div className="flex justify-center mb-8 animate-fade-in">
            <NewMeetingDialog selectedDate={selectedDate} onSave={handleSaveMeeting} />
          </div>
        )}

        {/* Admin Panel */}
        {showAdminPanel && isAdmin ? (
          <AdminPanel
            meetings={pendingMeetings}
            onApprove={handleApproveMeeting}
            onReject={handleRejectMeeting}
            onOpenDetails={handleMeetingSelect}
          />
        ) : (
          <>
            {/* Calendar Header */}
            <CalendarHeader
              currentMonth={currentMonth}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
            />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Calendar Grid */}
              <div className="lg:col-span-2">
                <CalendarGrid
                  currentMonth={currentMonth}
                  meetings={meetings.filter((m) => isAdmin || m.status === "approved")}
                  selectedDate={selectedDate}
                  onDateClick={handleDateClick}
                />
              </div>

              {/* Meeting List */}
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
  );
};

export default Index;










