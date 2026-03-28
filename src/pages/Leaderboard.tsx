import { AppLayout } from "@/components/AppLayout";
import { LeaderboardPodium } from "@/components/LeaderboardPodium";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserProfile, Unit } from "@/lib/mock-data";

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").then(({ data }) => {
      if (data) {
        setUsers(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          unit: p.unit as Unit,
          area: p.area,
          totalHours: Number(p.total_hours),
          avatarUrl: p.avatar_url || undefined,
        })));
      }
    });
  }, []);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">🏆 Ranking</h2>
          <p className="text-muted-foreground text-sm">Veja quem lidera a corrida do conhecimento</p>
        </div>
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
