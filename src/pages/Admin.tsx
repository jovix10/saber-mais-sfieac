import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Users, TrendingUp, FileText, Clock, Plus, BookOpen, Link as LinkIcon, Target, Shield, Upload, Download, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string; name: string; email: string; unit: string; area: string; total_hours: number; avatar_url: string | null;
}
interface Cert {
  id: string; user_id: string; title: string; hours: number; competence: string; status: string; created_at: string; file_url: string | null;
}
interface Course {
  id: string; title: string; description: string; competence: string; hours: number; provider: string; external_url: string; active: boolean;
}
interface UserRole {
  user_id: string; role: string;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', unit: 'FIEAC', area: '' });
  const [tab, setTab] = useState<'overview' | 'certs' | 'courses' | 'goals'>('overview');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const [{ data: p }, { data: c }, { data: co }, { data: r }, { data: g }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("certificates").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("unit_goals").select("*"),
    ]);
    if (p) setProfiles(p as Profile[]);
    if (c) setCerts(c as Cert[]);
    if (co) setCourses(co as Course[]);
    if (r) setRoles(r as UserRole[]);
    if (g) {
      const goalsMap: Record<string, number> = {};
      (g as any[]).forEach(item => { goalsMap[item.unit] = item.goal_hours; });
      setGoals(goalsMap);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const isUserAdmin = (userId: string) => roles.some(r => r.user_id === userId && r.role === 'admin');

  const toggleAdmin = async (userId: string) => {
    if (isUserAdmin(userId)) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast.success("Permissão de admin removida");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      toast.success("Usuário promovido a admin");
    }
    fetchAll();
  };

  const handleCertAction = async (certId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from("certificates").update({ status }).eq("id", certId);
    if (error) { toast.error("Erro ao atualizar certificado"); return; }
    
    // Create notification for the user
    const cert = certs.find(c => c.id === certId);
    if (cert) {
      await supabase.from("notifications").insert({
        user_id: cert.user_id,
        title: status === 'approved' ? '✅ Certificado Aprovado!' : '❌ Certificado Reprovado',
        message: `Seu certificado "${cert.title}" foi ${status === 'approved' ? 'aprovado' : 'reprovado'}.`,
        type: status === 'approved' ? 'success' : 'error',
      });

      // Create achievement if approved
      if (status === 'approved') {
        const user = profiles.find(p => p.id === cert.user_id);
        if (user) {
          await supabase.from("achievements").insert({
            user_id: cert.user_id,
            user_name: user.name,
            user_unit: user.unit,
            description: `completou "${cert.title}" (${cert.hours}h)`,
          });
        }
      }
    }

    toast.success(status === 'approved' ? 'Certificado aprovado!' : 'Certificado reprovado');
    fetchAll();
  };

  const handleAddCourse = async () => {
    if (!courseForm.title) return;
    const { error } = await supabase.from("courses").insert({
      title: courseForm.title,
      description: courseForm.description,
      competence: courseForm.competence,
      hours: parseInt(courseForm.hours) || 1,
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

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: userForm.email,
      password: userForm.password,
      options: { data: { name: userForm.name, unit: userForm.unit, area: userForm.area } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Usuário cadastrado com sucesso!");
      setUserForm({ name: '', email: '', password: '', unit: 'FIEAC', area: '' });
      setShowUserDialog(false);
      setTimeout(fetchAll, 1500);
    }
    setSubmitting(false);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0].toLowerCase();
    
    if (!header.includes('nome') || !header.includes('email') || !header.includes('senha')) {
      toast.error("Formato inválido. Use: nome;email;senha;unidade;area");
      setSubmitting(false);
      return;
    }

    let success = 0;
    let errors = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';').map(s => s.trim());
      if (parts.length < 3) continue;
      const [name, email, password, unit, area] = parts;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, unit: unit || 'FIEAC', area: area || '' } },
      });
      if (error) errors++;
      else success++;
    }
    toast.success(`${success} usuários cadastrados. ${errors > 0 ? `${errors} erros.` : ''}`);
    setShowBulkDialog(false);
    setSubmitting(false);
    setTimeout(fetchAll, 2000);
  };

  const downloadTemplate = () => {
    const csv = "nome;email;senha;unidade;area\nJoão Silva;joao@fieac.org.br;Senha@123;SESI;TI\nMaria Santos;maria@fieac.org.br;Senha@456;SENAI;RH";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_usuarios.csv';
    a.click();
  };

  const handleGoalUpdate = async (unit: string, hours: number) => {
    const { error } = await supabase.from("unit_goals").update({ goal_hours: hours }).eq("unit", unit);
    if (error) toast.error("Erro ao atualizar meta");
    else {
      toast.success(`Meta do ${unit} atualizada para ${hours}h`);
      setGoals(prev => ({ ...prev, [unit]: hours }));
    }
  };

  const viewCertFile = async (fileUrl: string | null) => {
    if (!fileUrl) { toast.error("Nenhum arquivo anexado"); return; }
    const { data } = await supabase.storage.from("certificates").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    else toast.error("Erro ao abrir arquivo");
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
    { key: 'overview' as const, label: 'Colaboradores' },
    { key: 'certs' as const, label: 'Certificados' },
    { key: 'courses' as const, label: 'Cursos' },
    { key: 'goals' as const, label: 'Metas' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Painel Administrativo</h2>
            <p className="text-muted-foreground text-sm">Gerencie colaboradores, certificados, cursos e metas</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Usuário</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="Nome do colaborador" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="Seu email institucional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder="Senha inicial" minLength={6} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Select value={userForm.unit} onValueChange={v => setUserForm({ ...userForm, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIEAC">FIEAC</SelectItem>
                          <SelectItem value="SESI">SESI</SelectItem>
                          <SelectItem value="SENAI">SENAI</SelectItem>
                          <SelectItem value="IEL">IEL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Área</Label>
                      <Input value={userForm.area} onChange={e => setUserForm({ ...userForm, area: e.target.value })} placeholder="Ex: TI" />
                    </div>
                  </div>
                  <Button onClick={handleAddUser} disabled={submitting} className="w-full">
                    {submitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Importar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Importar Usuários em Massa</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Envie um arquivo CSV com o formato: <code className="bg-muted px-1 rounded">nome;email;senha;unidade;area</code>
                  </p>
                  <Button variant="outline" className="gap-2 w-full" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" /> Baixar Template
                  </Button>
                  <div className="space-y-2">
                    <Label>Arquivo CSV</Label>
                    <Input type="file" accept=".csv" onChange={handleBulkUpload} disabled={submitting} />
                  </div>
                  {submitting && <p className="text-sm text-muted-foreground text-center">Processando...</p>}
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
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
                    <th className="text-right py-2 font-medium text-muted-foreground">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(user => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{user.name}</td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${user.unit.toLowerCase()}`}>{user.unit}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.area}</td>
                      <td className="py-3 text-right font-heading font-semibold text-foreground">{Number(user.total_hours)}h</td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant={isUserAdmin(user.id) ? "default" : "outline"} onClick={() => toggleAdmin(user.id)} className="gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          {isUserAdmin(user.id) ? 'Admin' : 'Tornar Admin'}
                        </Button>
                      </td>
                    </tr>
                  ))}
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
                  <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">{userName} · {cert.hours}h · {cert.competence} · {new Date(cert.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cert.file_url && (
                        <Button size="sm" variant="ghost" onClick={() => viewCertFile(cert.file_url)} className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> Ver PDF
                        </Button>
                      )}
                      {cert.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50 gap-1" onClick={() => handleCertAction(cert.id, 'approved')}>
                            <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 gap-1" onClick={() => handleCertAction(cert.id, 'rejected')}>
                            <XCircle className="h-3.5 w-3.5" /> Reprovar
                          </Button>
                        </>
                      )}
                      {cert.status !== 'pending' && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${cert.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {cert.status === 'approved' ? 'Aprovado' : 'Reprovado'}
                        </span>
                      )}
                    </div>
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
                  <DialogHeader><DialogTitle>Adicionar Curso</DialogTitle></DialogHeader>
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
                            <SelectItem value="Outros">Outros</SelectItem>
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
              {courses.length === 0 && <p className="text-muted-foreground text-sm">Nenhum curso cadastrado</p>}
              {courses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.provider} · {course.hours}h · {course.competence}</p>
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

        {/* Goals Management */}
        {tab === 'goals' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" /> Metas por Unidade
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Defina as metas de horas de capacitação para SENAI e SESI. As horas são contabilizadas apenas após a validação do certificado.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['SENAI', 'SESI'].map(unit => (
                <div key={unit} className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${unit.toLowerCase()}`}>{unit}</span>
                    <span className="text-sm font-medium text-foreground">Meta de Horas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={goals[unit] ?? 20}
                      onChange={e => setGoals(prev => ({ ...prev, [unit]: parseInt(e.target.value) || 0 }))}
                      className="w-24"
                      min={1}
                    />
                    <span className="text-sm text-muted-foreground">horas</span>
                    <Button size="sm" onClick={() => handleGoalUpdate(unit, goals[unit] ?? 20)}>
                      Salvar
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {profiles.filter(p => p.unit === unit).length} colaboradores ·{' '}
                    {profiles.filter(p => p.unit === unit && Number(p.total_hours) >= (goals[unit] ?? 20)).length} atingiram a meta
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
