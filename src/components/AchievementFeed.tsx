import { mockAchievements, unitColors } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AchievementFeed() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        Conquistas Recentes
      </h3>
      <div className="space-y-3">
        {mockAchievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className={`h-8 w-8 rounded-full unit-badge-${a.userUnit.toLowerCase()} flex items-center justify-center text-xs font-bold shrink-0`}>
              {a.userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                <span className="font-semibold">{a.userName}</span>{' '}
                <span className="text-muted-foreground">{a.description}</span>
              </p>
              <p className="text-xs text-muted-foreground">{a.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
