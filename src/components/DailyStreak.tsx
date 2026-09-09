import { motion } from "framer-motion";
import { CheckCircleFill, CalendarWeek, LightningChargeFill } from "react-bootstrap-icons";

export function DailyStreak() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-5 border border-border/50 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <LightningChargeFill className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-heading font-bold text-foreground leading-none">Frequência Semanal</h4>
            <p className="text-[11px] text-muted-foreground mt-1">Acompanhamento contínuo de metas</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-muted px-2.5 py-1 rounded-full text-foreground/80 flex items-center gap-1.5">
          <CalendarWeek className="h-3 w-3" /> Ciclo Ativo
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 my-2">
        {days.map((d, i) => {
          const isToday = i === dayOfWeek;
          const isPast = i < dayOfWeek;

          return (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">{d}</span>
              <div
                className={`h-9 w-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                  isToday
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                    : isPast
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted/40 text-muted-foreground/60 border border-transparent"
                }`}
              >
                {isPast ? <CheckCircleFill className="h-3.5 w-3.5" /> : d.slice(0, 1)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 mt-1 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span>Engajamento do Ciclo</span>
        <span className="font-semibold text-foreground">Regular</span>
      </div>
    </motion.div>
  );
}