import { type UserProfile, type Unit } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, Award, ShieldCheck } from "react-bootstrap-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserLevel } from "@/components/UserLevel";

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
  const rankLabels = ['2º', '1º', '3º'];
  const rankColors = [
    'text-slate-400 border-slate-300 bg-slate-100 dark:bg-slate-800',
    'text-amber-500 border-amber-400 bg-amber-50 dark:bg-amber-950/40',
    'text-amber-700 border-amber-600 bg-orange-50 dark:bg-orange-950/40'
  ];
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
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => {
                const realIdx = sorted.findIndex(u => u.id === user.id);
                setSelectedUser({ ...user, rank: realIdx + 1 });
              }}
            >
              <div className={`${sizes[i]} rounded-full overflow-hidden border-2 border-primary/20 shadow-md mb-2 group-hover:border-primary transition-colors`}>
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
              
              <div className={`${heights[i]} w-16 md:w-20 rounded-t-xl bg-muted/40 border-t border-x border-border mt-2 flex flex-col items-center justify-start pt-2 gap-1`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${rankColors[i]}`}>
                  {rankLabels[i]}
                </span>
                <Award className="h-4 w-4 text-muted-foreground mt-1" />
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
            transition={{ delay: 0.2 + i * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border transition-all cursor-pointer"
            onClick={() => setSelectedUser({ ...user, rank: i + 4 })}
          >
            <span className="text-xs font-bold text-muted-foreground w-6 text-center">{i + 4}º</span>
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
            <span className="text-sm font-heading font-semibold text-foreground">{user.totalHours}h</span>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-sm">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Ficha do Colaborador</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full unit-badge-${selectedUser.unit.toLowerCase()} flex items-center justify-center font-heading font-bold text-2xl`}>
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-heading font-bold text-lg text-foreground">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.unit} • {selectedUser.area || 'Geral'}</p>
                </div>
                <div className="flex items-center gap-3 w-full justify-center">
                  <div className="text-center px-4 py-2 rounded-xl bg-muted/40 border">
                    <p className="text-lg font-bold text-foreground">{selectedUser.rank}º</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Posição</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl bg-muted/40 border">
                    <p className="text-lg font-bold text-foreground">{selectedUser.totalHours}h</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Carga Horária</p>
                  </div>
                </div>
                <div className="w-full">
                  <UserLevel hours={selectedUser.totalHours} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}