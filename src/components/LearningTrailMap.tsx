import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { CheckCircle, Lock, Star, Rocket, Flag, Zap, BookOpen, Trophy } from "lucide-react";

interface TrailNode {
  id: string;
  title: string;
  hours: number;
  competence: string;
  completed: boolean;
  status: string;
}

const TRAIL_MILESTONES = [
  { hours: 0, label: "Início da Jornada", icon: Rocket, emoji: "🚀" },
  { hours: 5, label: "Primeiros Passos", icon: Star, emoji: "⭐" },
  { hours: 10, label: "Em Evolução", icon: Zap, emoji: "⚡" },
  { hours: 20, label: "Conhecimento Sólido", icon: BookOpen, emoji: "📚" },
  { hours: 40, label: "Referência", icon: Trophy, emoji: "🏆" },
  { hours: 80, label: "Lenda do Saber+", icon: Flag, emoji: "🏁" },
];

export function LearningTrailMap() {
  const { user, profile } = useAuth();
  const [certs, setCerts] = useState<TrailNode[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("certificates")
      .select("id, title, hours, competence, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setCerts(data.map(c => ({ ...c, completed: c.status === "approved" })));
        }
      });
  }, [user]);

  const totalHours = Number(profile?.total_hours) || 0;
  const approvedCerts = certs.filter(c => c.completed);
  const pendingCerts = certs.filter(c => !c.completed);

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-lg text-foreground">🗺️ Minha Trilha de Aprendizado</h3>
        <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
          {approvedCerts.length} curso{approvedCerts.length !== 1 ? "s" : ""} concluído{approvedCerts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Milestone trail */}
      <div className="relative">
        {/* Vertical line for mobile, horizontal for desktop */}
        <div className="hidden md:block absolute top-6 left-0 right-0 h-1 bg-muted rounded-full z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(
                (totalHours / TRAIL_MILESTONES[TRAIL_MILESTONES.length - 1].hours) * 100,
                100
              )}%`,
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden md:grid grid-cols-6 gap-1 relative z-10">
          {TRAIL_MILESTONES.map((m, i) => {
            const reached = totalHours >= m.hours;
            const Icon = m.icon;
            return (
              <motion.div
                key={m.hours}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${
                    reached
                      ? "bg-gradient-to-br from-accent to-primary text-white shadow-lg shadow-accent/30 scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {reached ? (
                    <span className="text-lg">{m.emoji}</span>
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <p className={`text-[11px] font-heading font-semibold leading-tight ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                  {m.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{m.hours}h</p>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-0 relative pl-8">
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-muted z-0">
            <motion.div
              className="w-full bg-gradient-to-b from-accent to-primary rounded-full"
              initial={{ height: 0 }}
              animate={{
                height: `${Math.min(
                  (totalHours / TRAIL_MILESTONES[TRAIL_MILESTONES.length - 1].hours) * 100,
                  100
                )}%`,
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          {TRAIL_MILESTONES.map((m, i) => {
            const reached = totalHours >= m.hours;
            return (
              <motion.div
                key={m.hours}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 py-3 relative z-10"
              >
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 -ml-8 transition-all ${
                    reached
                      ? "bg-gradient-to-br from-accent to-primary text-white shadow-md"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {reached ? <span className="text-sm">{m.emoji}</span> : <Lock className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className={`text-xs font-heading font-semibold ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.hours}h necessárias</p>
                </div>
                {reached && <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Completed courses trail */}
      {approvedCerts.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Cursos Concluídos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {approvedCerts.map((cert, i) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{cert.title}</p>
                  <p className="text-[10px] text-muted-foreground">{cert.hours}h · {cert.competence}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending courses */}
      {pendingCerts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-heading font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Em Análise</p>
          <div className="flex flex-wrap gap-2">
            {pendingCerts.map(cert => (
              <span key={cert.id} className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 font-medium">
                ⏳ {cert.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {certs.length === 0 && (
        <div className="text-center py-8">
          <Rocket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Sua trilha começa aqui!</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Envie seu primeiro certificado para iniciar a jornada</p>
        </div>
      )}
    </div>
  );
}
