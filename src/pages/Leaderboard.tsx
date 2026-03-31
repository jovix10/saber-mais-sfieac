import { AppLayout } from "@/components/AppLayout";
import { LeaderboardPodium } from "@/components/LeaderboardPodium";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile, Unit } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("visible_in_ranking", true).then(({ data }) => {
      if (data) {
        const mapped = (data as any[]).map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          unit: p.unit as Unit,
          area: p.area,
          totalHours: Number(p.total_hours),
          avatarUrl: p.avatar_url || undefined,
        }));
        setUsers(mapped);

        // Challenge trigger
        if (profile) {
          const myHours = Number(profile.total_hours);
          const sorted = [...mapped].sort((a, b) => b.totalHours - a.totalHours);
          const myIdx = sorted.findIndex(u => u.id === profile.id);
          if (myIdx > 0) {
            const above = sorted[myIdx - 1];
            const diff = above.totalHours - myHours;
            if (diff <= 10 && diff > 0) {
              setChallenge(`🔥 Faltam apenas ${diff}h para você ultrapassar ${above.name.split(' ')[0]}!`);
            }
          }
        }
      }
    });
  }, [profile]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">🏆 Ranking</h2>
          <p className="text-muted-foreground text-sm">Veja quem lidera a corrida do conhecimento</p>
        </div>

        {challenge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30"
          >
            <Zap className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-foreground">{challenge}</p>
          </motion.div>
        )}

        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">Geral</TabsTrigger>
            <TabsTrigger value="SESI">SESI</TabsTrigger>
            <TabsTrigger value="SENAI">SENAI</TabsTrigger>
            <TabsTrigger value="FIEAC">FIEAC</TabsTrigger>
            <TabsTrigger value="IEL">IEL</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <LeaderboardPodium users={users} title="Top Geral FIEAC" />
          </TabsContent>
          {(['SESI', 'SENAI', 'FIEAC', 'IEL'] as Unit[]).map(unit => (
            <TabsContent key={unit} value={unit}>
              <LeaderboardPodium users={users} title={`Top ${unit}`} filterUnit={unit} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
