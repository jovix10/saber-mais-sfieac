import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Award, Clock, Plus, CheckCircle, XCircle, ClipboardList, BookOpen, Send, BarChart3, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
  competence: string;
  created_at: string;
}

interface TeamTask {
  id: string;
  assigned_by: string;
  assigned_to: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  due_date: string | null;
  evidence_url: string | null;
  evidence_note: string | null;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [goal, setGoal] = useState(20);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'tasks' | 'certs'>('overview');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', task_type: 'tarefa', assigned_to: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
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

      const [{ data: teamCerts }, { data: teamTasks }] = await Promise.all([
        supabase.from("certificates").select("*").in("user_id", teamData.map(m => m.id)).order("created_at", { ascending: false }),
        supabase.from("team_tasks").select("*").eq("assigned_by", user.id).order("created_at", { ascending: false }),
      ]);
      if (teamCerts) setCerts(teamCerts as Cert[]);
      if (teamTasks) setTasks(teamTasks as TeamTask[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const avgHours = team.length ? Math.round(team.reduce((a, b) => a + Number(b.total_hours), 0) / team.length) : 0;
  const metGoal = team.filter(m => Number(m.total_hours) >= goal).length;
  const pendingCerts = certs.filter(c => c.status === 'pending').length;
  const pendingTasks = tasks.filter(t => t.status === 'pendente').length;

  // Chart data
  const barData = team.map(m => ({ name: m.name.split(' ')[0], horas: Number(m.total_hours), meta: goal })).sort((a, b) => b.horas - a.horas);

  const competenceData = (() => {
    const map: Record<string, number> = {};
    certs.filter(c => c.status === 'approved').forEach(c => { map[c.competence] = (map[c.competence] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const taskStatusData = (() => {
    const counts = { pendente: 0, 'em andamento': 0, concluído: 0 };
    tasks.forEach(t => { if (t.status in counts) counts[t.status as keyof typeof counts]++; });
    return [
      { name: 'Pendente', value: counts.pendente, color: 'hsl(38, 92%, 50%)' },
      { name: 'Em Andamento', value: counts['em andamento'], color: 'hsl(var(--primary))' },
      { name: 'Concluído', value: counts.concluído, color: 'hsl(142, 71%, 45%)' },
    ].filter(d => d.value > 0);
  })();

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.assigned_to || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("team_tasks").insert({
      assigned_by: user.id,
      assigned_to: taskForm.assigned_to,
      title: taskForm.title,
      description: taskForm.description,
      task_type: taskForm.task_type,
      due_date: taskForm.due_date || null,
    } as any);
    if (error) {
      toast.error("Erro ao criar tarefa");
    } else {
      // Notify the user
      const member = team.find(m => m.id === taskForm.assigned_to);
      await supabase.from("notifications").insert({
        user_id: taskForm.assigned_to,
        title: '📋 Nova Tarefa Atribuída',
        message: `Seu gestor atribuiu: "${taskForm.title}"`,
        type: 'info',
      });
      toast.success(`Tarefa atribuída para ${member?.name || 'colaborador'}!`);
      setTaskForm({ title: '', description: '', task_type: 'tarefa', assigned_to: '', due_date: '' });
      setShowTaskDialog(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    await supabase.from("team_tasks").update({ status: newStatus } as any).eq("id", taskId);
    toast.success("Status atualizado!");
    fetchData();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const chartConfig = {
    horas: { label: "Horas", color: "hsl(var(--primary))" },
    meta: { label: "Meta", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">🏢 Minha Equipe</h2>
            <p className="text-sm text-muted-foreground">Acompanhe o desempenho e gerencie tarefas dos seus colaboradores</p>
          </div>
          <Button onClick={() => setShowTaskDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Tarefa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Membros', value: team.length, icon: Users, color: 'text-blue-500' },
            { label: 'Média de Horas', value: avgHours + 'h', icon: TrendingUp, color: 'text-violet-500' },
            { label: 'Atingiram Meta', value: `${metGoal}/${team.length}`, icon: Award, color: 'text-emerald-500' },
            { label: 'Cert. Pendentes', value: pendingCerts, icon: Clock, color: 'text-amber-500' },
            { label: 'Tarefas Pendentes', value: pendingTasks, icon: ClipboardList, color: 'text-red-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-xl p-4">
              <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
              <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {([
            { key: 'overview' as const, label: '📊 Visão Geral' },
            { key: 'tasks' as const, label: '📋 Tarefas' },
            { key: 'certs' as const, label: '📄 Certificados' },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Hours per member */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Horas por Colaborador
                </h3>
                {barData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                )}
              </motion.div>

              {/* Pie Chart - Competences */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-500" /> Certificados por Competência
                </h3>
                {competenceData.length > 0 ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={competenceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {competenceData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum certificado aprovado ainda</p>
                )}
                {competenceData.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {competenceData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Task Status Summary */}
            {taskStatusData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-amber-500" /> Resumo de Tarefas
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Pendentes', count: tasks.filter(t => t.status === 'pendente').length, color: 'text-amber-500 bg-amber-500/10' },
                    { label: 'Em Andamento', count: tasks.filter(t => t.status === 'em andamento').length, color: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Concluídas', count: tasks.filter(t => t.status === 'concluído').length, color: 'text-emerald-500 bg-emerald-500/10' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 text-center ${s.color.split(' ')[1]}`}>
                      <p className={`font-heading font-bold text-3xl ${s.color.split(' ')[0]}`}>{s.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Team Members List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Colaboradores da Equipe
              </h3>
              {team.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum colaborador vinculado à sua equipe ainda.</p>
              ) : (
                <div className="space-y-3">
                  {team.sort((a, b) => Number(b.total_hours) - Number(a.total_hours)).map((member, i) => {
                    const pct = Math.min((Number(member.total_hours) / goal) * 100, 100);
                    const memberCerts = certs.filter(c => c.user_id === member.id);
                    const approved = memberCerts.filter(c => c.status === 'approved').length;
                    const memberTasks = tasks.filter(t => t.assigned_to === member.id);
                    const tasksDone = memberTasks.filter(t => t.status === 'concluído').length;
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
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">{member.area || member.unit}</span>
                            <span className="text-xs text-muted-foreground">{approved} certs</span>
                            <span className="text-xs text-muted-foreground">{tasksDone}/{memberTasks.length} tarefas</span>
                            {pct >= 100 && <span className="text-xs text-emerald-600 font-medium">✅ Meta</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma tarefa criada ainda.</p>
                <Button className="mt-4 gap-2" onClick={() => setShowTaskDialog(true)}>
                  <Plus className="h-4 w-4" /> Criar Primeira Tarefa
                </Button>
              </div>
            ) : (
              tasks.map((task, i) => {
                const member = team.find(m => m.id === task.assigned_to);
                const statusColors: Record<string, string> = {
                  pendente: 'bg-amber-500/10 text-amber-600 border-amber-200',
                  'em andamento': 'bg-blue-500/10 text-blue-600 border-blue-200',
                  concluído: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
                };
                const typeIcons: Record<string, React.ReactNode> = {
                  curso: <BookOpen className="h-4 w-4" />,
                  tarefa: <ClipboardList className="h-4 w-4" />,
                  certificado: <Award className="h-4 w-4" />,
                };
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 text-muted-foreground">{typeIcons[task.task_type] || <ClipboardList className="h-4 w-4" />}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">→ {member?.name || 'Colaborador'}</span>
                          {task.due_date && <span className="text-xs text-muted-foreground">📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>}
                          {task.evidence_note && <span className="text-xs text-emerald-600">📎 Evidência anexada</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[task.status] || 'bg-muted text-muted-foreground'}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                      {task.status !== 'concluído' && (
                        <Select value={task.status} onValueChange={v => handleTaskStatusChange(task.id, v)}>
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Certs Tab */}
        {tab === 'certs' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Certificados Recentes da Equipe</h3>
            {certs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum certificado da equipe.</p>
            ) : (
              <div className="space-y-2">
                {certs.slice(0, 20).map(cert => {
                  const member = team.find(m => m.id === cert.user_id);
                  return (
                    <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{cert.title}</p>
                        <p className="text-xs text-muted-foreground">{member?.name} · {cert.hours}h · {cert.competence} · {new Date(cert.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${cert.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : cert.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                        {cert.status === 'approved' ? 'Aprovado' : cert.status === 'pending' ? 'Pendente' : 'Reprovado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Task Dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Tarefa para Equipe</DialogTitle>
              <DialogDescription>Atribua uma tarefa, curso ou atividade para um membro da sua equipe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Ex: Concluir curso de LGPD" />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Detalhes sobre a tarefa..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={taskForm.task_type} onValueChange={v => setTaskForm({ ...taskForm, task_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tarefa">Tarefa</SelectItem>
                      <SelectItem value="curso">Curso</SelectItem>
                      <SelectItem value="certificado">Certificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo (opcional)</Label>
                  <Input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Colaborador</Label>
                <Select value={taskForm.assigned_to || '__none__'} onValueChange={v => setTaskForm({ ...taskForm, assigned_to: v === '__none__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione...</SelectItem>
                    {team.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTask} disabled={submitting || !taskForm.title || !taskForm.assigned_to} className="w-full gap-2">
                <Send className="h-4 w-4" /> {submitting ? 'Criando...' : 'Atribuir Tarefa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
