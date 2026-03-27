import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  user_name: string;
  user_unit: string;
  description: string;
  created_at: string;
}

export function AchievementFeed() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    supabase.from("achievements").select("*").order("created_at", { ascending: false }).limit(10).then(({ data }) => {
      if (data) setAchievements(data as Achievement[]);
    });
  }, []);

  if (achievements.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> Conquistas Recentes
        </h3>
        <p className="text-sm text-muted-foreground">Nenhuma conquista registrada ainda</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" /> Conquistas Recentes
      </h3>
      <div className="space-y-3">
        {achievements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <div className={`h-8 w-8 rounded-full unit-badge-${a.user_unit.toLowerCase()} flex items-center justify-center text-xs font-bold shrink-0`}>
              {a.user_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                <span className="font-semibold">{a.user_name}</span>{' '}
                <span className="text-muted-foreground">{a.description}</span>
              </p>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
