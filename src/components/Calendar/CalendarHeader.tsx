import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-bold gradient-text capitalize">
        {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
      </h2>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousMonth}
          className="glass-effect hover:scale-105 animate-smooth"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          className="glass-effect hover:scale-105 animate-smooth"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
