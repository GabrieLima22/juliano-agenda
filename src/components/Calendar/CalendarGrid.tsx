import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getMeetingCountMapForInterval } from "@/lib/recurrence";
import { Meeting } from "@/types/meeting";

interface CalendarGridProps {
  currentMonth: Date;
  meetings: Meeting[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
}

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "S\u00E1b"];

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
  const approvedMeetingCounts = useMemo(
    () => getMeetingCountMapForInterval(meetings, startDate, endDate, { approvedOnly: true }),
    [endDate, meetings, startDate],
  );

  const chipClass = (meetingCount: number, selected: boolean) => {
    const base =
      "absolute top-1 left-1 sm:left-auto sm:right-1 sm:top-1 flex items-center justify-center rounded-full border shadow-sm animate-smooth transition-all duration-300";

    const sizeClasses = selected
      ? "w-3 h-3 sm:w-auto sm:h-auto sm:min-w-[1.4rem] sm:px-1.5 sm:py-0.5"
      : "w-2.5 h-2.5 sm:w-auto sm:h-auto sm:min-w-[1.4rem] sm:px-1.5 sm:py-0.5";

    const colorClasses = (
      bg: string,
      text: string,
      border: string,
      selectedBg: string,
      selectedText: string,
    ) => `${base} ${sizeClasses} ${selected ? `${selectedBg} ${selectedText} ${border}` : `${bg} ${text} ${border}`}`;

    if (meetingCount >= 4) {
      return colorClasses(
        "bg-red-500/90",
        "text-transparent sm:text-white",
        "border-red-400/50",
        "bg-red-100",
        "text-red-800",
      );
    }

    if (meetingCount === 3) {
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
    <div translate="no" lang="pt-BR">
      <div className="mb-3 grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dateRange.map((date, i) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          const meetingCount = approvedMeetingCounts.get(format(date, "yyyy-MM-dd")) ?? 0;

          return (
            <button
              key={i}
              onClick={() => onDateClick(date)}
              className={cn(
                "relative aspect-square rounded-2xl p-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                "transform-gpu animate-smooth",
                isCurrentMonth
                  ? "text-foreground"
                  : "text-muted-foreground opacity-50",
                isSelected && "z-10 bg-primary text-primary-foreground shadow-elegant ring-1 ring-primary/20",
                isCurrentDay && !isSelected && "bg-accent text-accent-foreground font-bold ring-2 ring-primary ring-offset-2",
                !isSelected && !isCurrentDay && "hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-lg"
              )}
            >
              <span className="flex items-center justify-center h-full">
                {date.getDate()}
              </span>
              {meetingCount > 0 && (
                <span className={chipClass(meetingCount, Boolean(isSelected))}>
                  <span className="hidden sm:inline">{meetingCount}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
