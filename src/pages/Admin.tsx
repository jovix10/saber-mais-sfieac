import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Users, TrendingUp, FileText, Clock, Plus, BookOpen, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { unitGoals, type Unit } from "@/lib/mock-data";

interface Profile {
  id: string; name: string; email: string; unit: string; area: string; total_hours: number;
}
interface Cert {
  id: string; user_id: string; title: string; hours: number; competence: string; status: string; created_at: string;
}
interface Course {
  id: string; title: string; description: string; competence: string; hours: number; provider: string; external_url: string; active: boolean;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '' });
  const [tab, setTab] = useState<'overview' | 'certs' | 'courses'>('overview');

  const fetchAll = async () => {
    const [{ data: p }, { data: c }, { data: co }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("certificates").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
    ]);
    if (p) setProfiles(p as Profile[]);
    if (c) setCerts(c as Cert[]);
    if (co) setCourses(co as Course[]);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCertAction = async (certId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from("certificates").update({ status }).eq("id", certId);
    if (error) { toast.error("Erro ao atualizar certificado"); return; }
    toast.success(status === 'approved' ? 'Certificado aprovado!' : 'Certificado reprovado');
    fetchAll();
  };

  const handleAddCourse = async () => {
    const { error } = await supabase.from("courses").insert({
      title: courseForm.title,
      description: courseForm.description,
      competence: courseForm.competence,
      hours: parseInt(courseForm.hours),
      provider: courseForm.provider,
      external_url: courseForm.external_url,
    });
    if (error) { toast.error("Erro ao criar curso"); return; }
    toast.success("Curso criado!");
    setCourseForm({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '' });
    setShowCourseDialog(false);
    fetchAll();
  };

  const toggleCourse = async (id: string, active: boolean) => {
    await supabase.from("courses").update({ active: !active }).eq("id", id);
    fetchAll();
  };

  const pendingCerts = certs.filter(c => c.status === 'pending');
  const avgHours = profiles.length ? Math.round(profiles.reduce((a, b) => a + Number(b.total_hours), 0) / profiles.length) : 0;

  const stats = [
    { label: 'Total Colaboradores', value: profiles.length, icon: Users, color: 'text-blue-500' },
    { label: 'Certificados Pendentes', value: pendingCerts.length, icon: Clock, color: 'text-amber-500' },
    { label: 'Certificados Aprovados', value: certs.filter(c => c.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Média de Horas', value: avgHours + 'h', icon: TrendingUp, color: 'text-violet-500' },
  ];

  const tabs = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'certs', label: 'Certificados' },
    { key: 'courses', label: 'Cursos' },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Painel Administrativo</h2>
          <p className="text-muted-foreground text-sm">Gerencie colaboradores, certificados e cursos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-4">
              <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
              <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview - Users Table */}
        {tab === 'overview' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" /> Colaboradores
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">E-mail</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Unidade</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Área</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Horas</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(user => {
                    const goal = unitGoals[user.unit as Unit] || 20;
                    const pct = Math.min((Number(user.total_hours) / goal) * 100, 100);
                    return (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-foreground">{user.name}</td>
                        <td className="py-3 text-muted-foreground">{user.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${user.unit.toLowerCase()}`}>{user.unit}</span>
                        </td>
                        <td className="py-3 text-muted-foreground">{user.area}</td>
                        <td className="py-3 text-right font-heading font-semibold text-foreground">{Number(user.total_hours)}h</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificates Management */}
        {tab === 'certs' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" /> Todos os Certificados
            </h3>
            <div className="space-y-3">
              {certs.length === 0 && <p className="text-muted-foreground text-sm">Nenhum certificado</p>}
              {certs.map(cert => {
                const userName = profiles.find(p => p.id === cert.user_id)?.name || 'Usuário';
                return (
                  <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">{userName} · {cert.hours}h · {cert.competence} · {cert.status}</p>
                    </div>
                    {cert.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50 gap-1" onClick={() => handleCertAction(cert.id, 'approved')}>
                          <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 gap-1" onClick={() => handleCertAction(cert.id, 'rejected')}>
                          <XCircle className="h-3.5 w-3.5" /> Reprovar
                        </Button>
                      </div>
                    )}
                    {cert.status !== 'pending' && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${cert.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {cert.status === 'approved' ? 'Aprovado' : 'Reprovado'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courses Management */}
        {tab === 'courses' && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Cursos
              </h3>
              <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Curso</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Curso</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Nome do curso" />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Breve descrição" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Competência</Label>
                        <Select value={courseForm.competence} onValueChange={v => setCourseForm({ ...courseForm, competence: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Digital">Digital</SelectItem>
                            <SelectItem value="Ambiental">Ambiental</SelectItem>
                            <SelectItem value="Inclusiva">Inclusiva</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Horas</Label>
                        <Input type="number" value={courseForm.hours} onChange={e => setCourseForm({ ...courseForm, hours: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Provedor</Label>
                      <Input value={courseForm.provider} onChange={e => setCourseForm({ ...courseForm, provider: e.target.value })} placeholder="Ex: Coursera, FGV" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /> Link do Curso (oculto para o usuário)</Label>
                      <Input value={courseForm.external_url} onChange={e => setCourseForm({ ...courseForm, external_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <Button onClick={handleAddCourse} className="w-full">Criar Curso</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.provider} · {course.hours}h · {course.competence}</p>
                    <p className="text-xs text-muted-foreground/60 truncate max-w-xs">{course.external_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${course.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      {course.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => toggleCourse(course.id, course.active)}>
                      {course.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
