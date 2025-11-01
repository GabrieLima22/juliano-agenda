import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminToggleProps {
  onClick: () => void;
}

export const AdminToggle = ({ onClick }: AdminToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="fixed top-4 right-4 opacity-10 hover:opacity-100 animate-smooth z-50 hover:scale-110"
      title="Admin Access"
    >
      <Shield className="h-5 w-5" />
    </Button>
  );
};
