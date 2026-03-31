import { type UserProfile, type Unit } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserLevel } from "@/components/UserLevel";
import { Shield } from "lucide-react";

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
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { rank: number }) | null>(null);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const heights = ['h-24', 'h-32', 'h-20'];
  const medals = ['🥈', '🥇', '🥉'];
  const sizes = ['h-14 w-14', 'h-16 w-16', 'h-12 w-12'];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-lg text-foreground mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        {title}
      </h3>

      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {podiumOrder.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => {
                const realIdx = sorted.findIndex(u => u.id === user.id);
                setSelectedUser({ ...user, rank: realIdx + 1 });
              }}
            >
              <div className={`${sizes[i]} rounded-full overflow-hidden border-2 border-amber-400/50 shadow-lg mb-2`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className={`h-full w-full unit-badge-${user.unit.toLowerCase()} flex items-center justify-center font-heading font-bold text-lg`}>
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-foreground text-center truncate max-w-[90px]">{user.name.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground font-medium">{user.totalHours}h</p>
              <div className={`${heights[i]} w-16 md:w-20 rounded-t-xl bg-gradient-to-t from-primary/20 to-primary/5 mt-2 flex items-start justify-center pt-2`}>
                <span className="text-2xl">{medals[i]}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {rest.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="text-sm font-bold text-muted-foreground w-6">{i + 4}°</span>
            <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className={`h-full w-full unit-badge-${user.unit.toLowerCase()} flex items-center justify-center text-xs font-bold`}>
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.unit}</p>
            </div>
            <span className="text-sm font-heading font-bold text-foreground">{user.totalHours}h</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
