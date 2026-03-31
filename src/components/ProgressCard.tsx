import { motion } from "framer-motion";
import { type Unit } from "@/lib/mock-data";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressCardProps {
  unit: Unit;
  currentHours: number;
  userName: string;
}

export function ProgressCard({ unit, currentHours, userName }: ProgressCardProps) {
  const [goal, setGoal] = useState(20);

  useEffect(() => {
    supabase.from("unit_goals").select("goal_hours").eq("unit", unit).single().then(({ data }) => {
      if (data) setGoal(data.goal_hours);
    });
  }, [unit]);

  const percentage = Math.min((currentHours / goal) * 100, 100);
  const exceeded = currentHours > goal;

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-muted-foreground text-sm">Olá, <span className="font-semibold text-foreground">{userName}</span></p>
          <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mt-1">
            Seu Progresso {new Date().getFullYear()}
          </h2>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold unit-badge-${unit.toLowerCase()}`}>
          {unit}
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Meta: {goal}h {exceeded && `(Excedido! +${currentHours - goal}h)`}
            </span>
          </div>
          <span className="font-heading font-bold text-2xl text-foreground">{currentHours}h</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">{percentage.toFixed(0)}% da meta</p>
      </div>
    </div>
  );
}
