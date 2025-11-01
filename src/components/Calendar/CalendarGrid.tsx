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
    return meetings.filter((m) => m.date === dateStr).length;
  };

  const chipClass = (count: number, selected: boolean) => {
    const base = "absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm animate-smooth";
    if (count >= 4) return `${base} ${selected ? "bg-red-100 text-red-800 border-red-200" : "bg-red-500/90 text-white border-red-400/50"}`;
    if (count >= 2) return `${base} ${selected ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-blue-500/90 text-white border-blue-400/50"}`;
    return `${base} ${selected ? "bg-green-100 text-green-800 border-green-200" : "bg-green-500/90 text-white border-green-400/50"}`;
  };

  return (
    <div className="glass-effect rounded-3xl p-6 shadow-glass animate-fade-in">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
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
                "relative aspect-square rounded-2xl p-2 text-sm font-medium transition-all duration-300",
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
                {meetingCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
