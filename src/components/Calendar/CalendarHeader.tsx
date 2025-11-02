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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8" translate="no" lang="pt-BR">
      <h2 className="text-3xl font-bold gradient-text capitalize">
        {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
      </h2>
      <div className="flex gap-2 self-end sm:self-auto">
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
