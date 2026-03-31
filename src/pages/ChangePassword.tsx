import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import logoFieac from "@/assets/logo-fieac.png";

export default function ChangePassword() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSubmitting(true);
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ must_change_password: false } as any)
        .eq("id", user!.id);
      if (profileError) throw profileError;

      await refreshProfile();
      toast.success("Senha redefinida com sucesso!");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <img src={logoFieac} alt="Saber+" className="h-14 w-auto mb-4" />
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Redefinir Senha</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center max-w-xs">
            Este é seu primeiro acesso. Por segurança, crie uma nova senha para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 rounded-xl"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-semibold text-base" disabled={submitting}>
            <KeyRound className="h-4 w-4" />
            {submitting ? "Aguarde..." : "Redefinir Senha"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
