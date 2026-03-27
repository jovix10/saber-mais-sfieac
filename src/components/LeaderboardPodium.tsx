import { type UserProfile, unitColors, type Unit } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardPodiumProps {
  users: UserProfile[];
  title: string;
  filterUnit?: Unit;
}

export function LeaderboardPodium({ users, title, filterUnit }: LeaderboardPodiumProps) {
  const filtered = filterUnit ? users.filter(u => u.unit === filterUnit) : users;
  const sorted = [...filtered].sort((a, b) => b.totalHours - a.totalHours);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const heights = ['h-24', 'h-32', 'h-20'];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-lg text-foreground mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        {title}
      </h3>

      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {podiumOrder.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center"
            >
              <div className={`h-12 w-12 md:h-14 md:w-14 rounded-full unit-badge-${user.unit.toLowerCase()} flex items-center justify-center font-heading font-bold text-lg mb-2`}>
                {user.name.charAt(0)}
              </div>
              <p className="text-xs font-semibold text-foreground text-center truncate max-w-[80px]">{user.name.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground font-medium">{user.totalHours}h</p>
              <div className={`${heights[i]} w-16 md:w-20 rounded-t-xl bg-primary/10 mt-2 flex items-start justify-center pt-2`}>
                <span className="text-2xl">{medals[i]}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {rest.map((user, i) => (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <span className="text-sm font-bold text-muted-foreground w-6">{i + 4}°</span>
            <div className={`h-8 w-8 rounded-full unit-badge-${user.unit.toLowerCase()} flex items-center justify-center text-xs font-bold shrink-0`}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.unit}</p>
            </div>
            <span className="text-sm font-heading font-bold text-foreground">{user.totalHours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
