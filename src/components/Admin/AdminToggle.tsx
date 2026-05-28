import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminToggleProps {
  onClick: () => void;
}

export const AdminToggle = ({ onClick }: AdminToggleProps) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="fixed right-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/75 bg-white/84 text-slate-600 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.26)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:scale-105 hover:text-slate-900 sm:right-6 sm:top-6"
      title="Acessar painel administrativo"
    >
      <Shield className="h-5 w-5" />
    </Button>
  );
};
