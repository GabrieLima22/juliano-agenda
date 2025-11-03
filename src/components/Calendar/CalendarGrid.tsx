import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Meeting } from "@/types/meeting";

interface CalendarGridProps {
  currentMonth: Date;
  meetings: Meeting[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
}

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const CalendarGrid = ({
  currentMonth,
  meetings,
  selectedDate,
  onDateClick,
}: CalendarGridProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const getMeetingCountForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return meetings.filter((meeting) => meeting.date === dateStr).length;
  };

  const chipClass = (count: number, selected: boolean) => {
    const base =
      "absolute top-1 left-1 sm:left-auto sm:right-1 sm:top-1 flex items-center justify-center rounded-full border shadow-sm animate-smooth transition-all";

    const sizeClasses = selected
      ? "w-3 h-3 sm:w-auto sm:h-auto sm:min-w-[1.4rem] sm:px-1.5 sm:py-0.5"
      : "w-2.5 h-2.5 sm:w-auto sm:h-auto sm:min-w-[1.4rem] sm:px-1.5 sm:py-0.5";

    const colorClasses = (bg: string, text: string, border: string, selectedBg: string, selectedText: string) =>
      `${base} ${sizeClasses} ${selected ? `${selectedBg} ${selectedText} ${border}` : `${bg} ${text} ${border}`}`;

    if (count >= 4) {
      return colorClasses(
        "bg-red-500/90",
        "text-transparent sm:text-white",
        "border-red-400/50",
        "bg-red-100",
        "text-red-800",
      );
    }
    if (count >= 2) {
      return colorClasses(
        "bg-blue-500/90",
        "text-transparent sm:text-white",
        "border-blue-400/50",
        "bg-blue-100",
        "text-blue-800",
      );
    }
    return colorClasses(
      "bg-green-500/90",
      "text-transparent sm:text-white",
      "border-green-400/50",
      "bg-green-100",
      "text-green-800",
    );
  };

  return (
    <div className="glass-effect rounded-3xl p-4 sm:p-6 shadow-glass animate-fade-in" translate="no" lang="pt-BR">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-4 text-xs sm:text-sm">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {dateRange.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          const meetingCount = getMeetingCountForDate(date);

          return (
            <button
              key={i}
              onClick={() => onDateClick(date)}
              className={cn(
                "relative aspect-square rounded-2xl p-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                "hover:scale-105 hover:shadow-lg animate-smooth",
                isCurrentMonth
                  ? "text-foreground"
                  : "text-muted-foreground opacity-50",
                isSelected && "bg-primary text-primary-foreground shadow-elegant scale-105",
                isCurrentDay && !isSelected && "bg-accent text-accent-foreground font-bold ring-2 ring-primary ring-offset-2",
                !isSelected && !isCurrentDay && "hover:bg-accent/50"
              )}
            >
              <span className="flex items-center justify-center h-full">
                {date.getDate()}
              </span>
              <span className={chipClass(meetingCount, Boolean(isSelected))}>
                <span className="hidden sm:inline">{meetingCount}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


