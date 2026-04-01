import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Award, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  unit: string;
  area: string;
  total_hours: number;
  avatar_url: string | null;
}

interface Cert {
  id: string;
  user_id: string;
  title: string;
  hours: number;
  status: string;
  created_at: string;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [goal, setGoal] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: members }, { data: goals }] = await Promise.all([
        supabase.from("profiles").select("*").eq("manager_id", user.id),
        supabase.from("unit_goals").select("*"),
      ]);
      const teamData = (members || []) as TeamMember[];
      setTeam(teamData);

      if (teamData.length > 0) {
        const unit = teamData[0].unit;
        const unitGoal = (goals || []).find((g: any) => g.unit === unit);
        if (unitGoal) setGoal((unitGoal as any).goal_hours);

        const { data: teamCerts } = await supabase.from("certificates").select("*").in("user_id", teamData.map(m => m.id)).order("created_at", { ascending: false });
        if (teamCerts) setCerts(teamCerts as Cert[]);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const avgHours = team.length ? Math.round(team.reduce((a, b) => a + Number(b.total_hours), 0) / team.length) : 0;
  const metGoal = team.filter(m => Number(m.total_hours) >= goal).length;
  const pendingCerts = certs.filter(c => c.status === 'pending').length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Minha Equipe</h2>
          <p className="text-sm text-muted-foreground">Acompanhe o desempenho e a evolução dos seus colaboradores</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Membros', value: team.length, icon: Users, color: 'text-blue-500' },
            { label: 'Média de Horas', value: avgHours + 'h', icon: TrendingUp, color: 'text-violet-500' },
            { label: 'Atingiram Meta', value: `${metGoal}/${team.length}`, icon: Award, color: 'text-emerald-500' },
            { label: 'Certificados Pendentes', value: pendingCerts, icon: Clock, color: 'text-amber-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-4">
              <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
              <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">Colaboradores da Equipe</h3>
          {team.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum colaborador vinculado à sua equipe ainda.</p>
          ) : (
            <div className="space-y-3">
              {team.sort((a, b) => Number(b.total_hours) - Number(a.total_hours)).map((member, i) => {
                const pct = Math.min((Number(member.total_hours) / goal) * 100, 100);
                const memberCerts = certs.filter(c => c.user_id === member.id);
                const approved = memberCerts.filter(c => c.status === 'approved').length;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}°</span>
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{member.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        <span className="text-sm font-heading font-bold text-foreground">{Number(member.total_hours)}h / {goal}h</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{member.area || member.unit}</span>
                        <span className="text-xs text-muted-foreground">{approved} certificados aprovados</span>
                        {pct >= 100 && <span className="text-xs text-emerald-600 font-medium">✅ Meta atingida</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {certs.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Certificados Recentes da Equipe</h3>
            <div className="space-y-2">
              {certs.slice(0, 10).map(cert => {
                const member = team.find(m => m.id === cert.user_id);
                return (
                  <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">{member?.name} · {cert.hours}h · {new Date(cert.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cert.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : cert.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                      {cert.status === 'approved' ? 'Aprovado' : cert.status === 'pending' ? 'Pendente' : 'Reprovado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
