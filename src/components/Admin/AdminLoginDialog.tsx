import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";
import { resolveApiBase } from "@/lib/runtime";

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

export const AdminLoginDialog = ({ open, onOpenChange, onLogin }: AdminLoginDialogProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const API_BASE = resolveApiBase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha no login");
      toast.success("Login realizado com sucesso.");
      onLogin();
      onOpenChange(false);
      setUsername("");
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao autenticar";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-none shadow-glass sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text text-center">
            Acesso Administrativo
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuário
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-white shadow-elegant hover:scale-105 animate-smooth font-semibold rounded-xl"
          >
            Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

