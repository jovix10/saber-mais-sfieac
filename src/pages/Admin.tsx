import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Users, TrendingUp, FileText, Clock, Plus, BookOpen, Link as LinkIcon, Target, Shield, Upload, Download, Eye, BarChart3, Image, UserCheck, Pencil, Save, HelpCircle, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string; name: string; email: string; unit: string; area: string; total_hours: number; avatar_url: string | null; visible_in_ranking: boolean; manager_id: string | null;
}
interface Cert {
  id: string; user_id: string; title: string; hours: number; competence: string; status: string; created_at: string; file_url: string | null;
}
interface Course {
  id: string; title: string; description: string; competence: string; hours: number; provider: string; external_url: string; active: boolean; image_url: string | null; is_compliance: boolean;
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
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [showUserDetailDialog, setShowUserDetailDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editHoursUser, setEditHoursUser] = useState<Profile | null>(null);
  const [editHoursValue, setEditHoursValue] = useState('');
  const [courseForm, setCourseForm] = useState({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '', image_url: '', is_compliance: false });
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', unit: 'FIEAC', area: '', role: 'user', manager_id: '' });
  const [tab, setTab] = useState<'overview' | 'certs' | 'courses' | 'goals' | 'reports' | 'support'>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({ email: 'suporte@fieac.org.br', phone: '(68) 3212-4200', message: 'Precisa de ajuda? Entre em contato com o suporte do Sistema FIEAC.' });
  const [resetPwUser, setResetPwUser] = useState<Profile | null>(null);
  const [resetPwValue, setResetPwValue] = useState('');
  const [credentialPopup, setCredentialPopup] = useState<{ name: string; email: string; password: string } | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ total: number; status: string } | null>(null);
  const [clearConfirmText, setClearConfirmText] = useState('');

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
    const saved = localStorage.getItem('saber_support_config');
    if (saved) setSupportForm(JSON.parse(saved));
  };

  useEffect(() => { fetchAll(); }, []);

  const isUserAdmin = (userId: string) => roles.some(r => r.user_id === userId && r.role === 'admin');
  const isUserGestor = (userId: string) => roles.some(r => r.user_id === userId && r.role === 'gestor');

  const getUserRole = (userId: string): string => {
    if (isUserAdmin(userId)) return 'admin';
    if (isUserGestor(userId)) return 'gestor';
    return 'user';
  };

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const invokeAdminFunction = async (body: any) => {
    const token = await getAuthToken();
    if (!token) { toast.error("Sessão expirada"); return null; }
    const res = await supabase.functions.invoke('admin-create-user', {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res;
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setSubmitting(true);
    const res = await invokeAdminFunction({ action: 'change_role', user_id: userId, new_role: newRole });
    if (res?.error || res?.data?.error) {
      toast.error(res?.data?.error || "Erro ao alterar cargo");
    } else {
      toast.success(`Cargo alterado para ${newRole === 'admin' ? 'Administrador' : newRole === 'gestor' ? 'Gestor' : 'Colaborador'}`);
      await fetchAll();
    }
    setSubmitting(false);
  };

  const assignManager = async (userId: string, managerId: string | null) => {
    await supabase.from("profiles").update({ manager_id: managerId } as any).eq("id", userId);
    toast.success(managerId ? "Gestor atribuído" : "Gestor removido");
    fetchAll();
  };

  const toggleRanking = async (userId: string, current: boolean) => {
    await supabase.from("profiles").update({ visible_in_ranking: !current } as any).eq("id", userId);
    toast.success(!current ? "Usuário visível no ranking" : "Usuário oculto do ranking");
    fetchAll();
  };

  const handleCertAction = async (certId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from("certificates").update({ status }).eq("id", certId);
    if (error) { toast.error("Erro ao atualizar certificado"); return; }
    const cert = certs.find(c => c.id === certId);
    if (cert) {
      await supabase.from("notifications").insert({
        user_id: cert.user_id,
        title: status === 'approved' ? '✅ Certificado Aprovado!' : '❌ Certificado Reprovado',
        message: `Seu certificado "${cert.title}" foi ${status === 'approved' ? 'aprovado' : 'reprovado'}.`,
        type: status === 'approved' ? 'success' : 'error',
      });
      if (status === 'approved') {
        const user = profiles.find(p => p.id === cert.user_id);
        if (user) {
          await supabase.from("achievements").insert({
            user_id: cert.user_id, user_name: user.name, user_unit: user.unit,
            description: `completou "${cert.title}" (${cert.hours}h)`,
          });
          if (cert.competence === 'Compliance') {
            const complianceCerts = certs.filter(c => c.user_id === cert.user_id && c.status === 'approved' && c.competence === 'Compliance').length + 1;
            let complianceBadge = '';
            if (complianceCerts === 1) complianceBadge = '🛡️ Guardião do Compliance - Nível 1';
            else if (complianceCerts === 3) complianceBadge = '🛡️ Sentinela do Compliance - Nível 2';
            else if (complianceCerts === 5) complianceBadge = '🛡️ Mestre do Compliance - Nível 3';
            else if (complianceCerts === 10) complianceBadge = '🛡️ Lenda do Compliance - Nível Máximo';
            if (complianceBadge) {
              await supabase.from("achievements").insert({ user_id: cert.user_id, user_name: user.name, user_unit: user.unit, description: complianceBadge });
              await supabase.from("notifications").insert({ user_id: cert.user_id, title: '🏆 Conquista Exclusiva de Compliance!', message: `Você desbloqueou: ${complianceBadge}`, type: 'success' });
            }
          }
        }
      }
    }
    toast.success(status === 'approved' ? 'Certificado aprovado!' : 'Certificado reprovado');
    fetchAll();
  };

  const uploadCourseImage = async (file: File) => {
    const filePath = `courses/${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return publicUrl;
    }
    return null;
  };

  const handleAddCourse = async () => {
    if (!courseForm.title) return;
    setSubmitting(true);
    let imageUrl = courseForm.image_url;
    if (courseImageFile) {
      const url = await uploadCourseImage(courseImageFile);
      if (url) imageUrl = url;
    }
    const { error } = await supabase.from("courses").insert({
      title: courseForm.title, description: courseForm.description, competence: courseForm.competence,
      hours: parseInt(courseForm.hours) || 1, provider: courseForm.provider, external_url: courseForm.external_url, image_url: imageUrl, is_compliance: courseForm.is_compliance,
    });
    if (error) { toast.error("Erro ao criar curso"); } else {
      toast.success("Curso criado!");
      setCourseForm({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '', image_url: '', is_compliance: false });
      setCourseImageFile(null);
      setShowCourseDialog(false);
      fetchAll();
    }
    setSubmitting(false);
  };

  const handleEditCourse = async () => {
    if (!editingCourse) return;
    setSubmitting(true);
    let imageUrl = editingCourse.image_url;
    if (courseImageFile) {
      const url = await uploadCourseImage(courseImageFile);
      if (url) imageUrl = url;
    }
    const { error } = await supabase.from("courses").update({
      title: editingCourse.title, description: editingCourse.description, competence: editingCourse.competence,
      hours: editingCourse.hours, provider: editingCourse.provider, external_url: editingCourse.external_url, image_url: imageUrl, is_compliance: editingCourse.is_compliance,
    }).eq("id", editingCourse.id);
    if (error) { toast.error("Erro ao atualizar curso"); } else {
      toast.success("Curso atualizado!");
      setShowEditCourseDialog(false);
      setEditingCourse(null);
      setCourseImageFile(null);
      fetchAll();
    }
    setSubmitting(false);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse({ ...course });
    setCourseImageFile(null);
    setShowEditCourseDialog(true);
  };

  const handleEditHours = async () => {
    if (!editHoursUser) return;
    const newHours = parseFloat(editHoursValue);
    if (isNaN(newHours) || newHours < 0) { toast.error("Valor inválido"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({ total_hours: newHours } as any).eq("id", editHoursUser.id);
    if (error) { toast.error("Erro ao atualizar horas"); } else {
      toast.success(`Horas de ${editHoursUser.name} atualizadas para ${newHours}h`);
      setShowEditHoursDialog(false);
      fetchAll();
    }
    setSubmitting(false);
  };

  const handleImpersonate = async (userId: string) => {
    const user = profiles.find(p => p.id === userId);
    if (!user) return;
    setSelectedUser(user);
    setShowUserDetailDialog(true);
  };

  const handleLoginAsUser = async (userId: string) => {
    const user = profiles.find(p => p.id === userId);
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('impersonate-user', {
        body: { user_id: userId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || "Erro ao acessar conta");
      } else if (res.data?.url) {
        toast.success(`Abrindo conta de ${user.name}...`);
        window.open(res.data.url, '_blank');
      }
    } catch {
      toast.error("Erro ao acessar conta do usuário");
    }
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || !resetPwValue) return;
    if (resetPwValue.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres"); return; }
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke('reset-password', {
        body: { user_id: resetPwUser.id, new_password: resetPwValue },
      });
      if (res.error) {
        const errorMsg = typeof res.error === 'object' && 'message' in res.error ? (res.error as any).message : String(res.error);
        toast.error(errorMsg || "Erro ao redefinir senha");
      } else if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success(`Senha de ${resetPwUser.name} redefinida com sucesso!`);
        setResetPwUser(null);
        setResetPwValue('');
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao redefinir senha");
    }
    setSubmitting(false);
  };

  const toggleCourse = async (id: string, active: boolean) => {
    await supabase.from("courses").update({ active: !active }).eq("id", id);
    fetchAll();
  };

  // Create user via edge function (doesn't change admin session)
  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) return;
    setSubmitting(true);
    const res = await invokeAdminFunction({
      action: 'create_single',
      email: userForm.email,
      password: userForm.password,
      name: userForm.name,
      unit: userForm.unit,
      area: userForm.area,
      role: userForm.role,
      manager_id: userForm.manager_id || undefined,
    });
    if (res?.error || res?.data?.error) {
      toast.error(res?.data?.error || "Erro ao cadastrar usuário");
    } else {
      setCredentialPopup({ name: userForm.name, email: userForm.email, password: userForm.password });
      setUserForm({ name: '', email: '', password: '', unit: 'FIEAC', area: '', role: 'user', manager_id: '' });
      setShowUserDialog(false);
      setTimeout(fetchAll, 1000);
    }
    setSubmitting(false);
  };

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUsers, setBulkUsers] = useState<any[]>([]);

  const handleBulkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("Arquivo vazio ou sem dados"); setBulkUsers([]); return; }
      
      // Detect separator
      const sep = lines[0].includes(';') ? ';' : ',';
      const headerParts = lines[0].split(sep).map(s => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      
      const nameIdx = headerParts.findIndex(h => h.includes('nome'));
      const emailIdx = headerParts.findIndex(h => h.includes('email') && !h.includes('gestor'));
      const senhaIdx = headerParts.findIndex(h => h.includes('senha'));
      const unitIdx = headerParts.findIndex(h => h.includes('unidade'));
      const areaIdx = headerParts.findIndex(h => h.includes('area') || h.includes('cargo'));
      const gestorIdx = headerParts.findIndex(h => h.includes('gestor'));

      if (nameIdx < 0 || emailIdx < 0 || senhaIdx < 0) {
        toast.error("Cabeçalho inválido. Precisa ter: nome, email, senha");
        setBulkUsers([]);
        return;
      }

      const users: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(sep).map(s => s.trim());
        const name = parts[nameIdx] || '';
        const email = parts[emailIdx] || '';
        const password = parts[senhaIdx] || '';
        if (!name || !email || !password) continue;
        
        users.push({
          name,
          email,
          password,
          unit: unitIdx >= 0 ? (parts[unitIdx] || 'FIEAC') : 'FIEAC',
          area: areaIdx >= 0 ? (parts[areaIdx] || '') : '',
          role: 'user',
          manager_email: gestorIdx >= 0 ? (parts[gestorIdx] || '') : '',
        });
      }

      setBulkUsers(users);
      if (users.length === 0) toast.error("Nenhum usuário válido encontrado");
      else toast.success(`${users.length} usuários encontrados no arquivo`);
    } catch (err: any) {
      toast.error("Erro ao ler arquivo: " + (err?.message || ''));
      setBulkUsers([]);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkUsers.length === 0) { toast.error("Nenhum usuário para cadastrar"); return; }
    setSubmitting(true);
    setBulkProgress({ total: bulkUsers.length, status: `Cadastrando ${bulkUsers.length} usuários...` });

    try {
      let totalSuccess = 0, totalErrors = 0;
      const allErrorDetails: string[] = [];
      const chunkSize = 25; // smaller chunks for reliability

      for (let i = 0; i < bulkUsers.length; i += chunkSize) {
        const chunk = bulkUsers.slice(i, i + chunkSize);
        setBulkProgress({ total: bulkUsers.length, status: `Processando ${i + 1}-${Math.min(i + chunkSize, bulkUsers.length)} de ${bulkUsers.length}...` });
        
        const res = await invokeAdminFunction({ action: 'bulk_create', users: chunk });
        if (res?.data && !res?.data?.error) {
          totalSuccess += res.data.success || 0;
          totalErrors += res.data.errors || 0;
          if (res.data.errorDetails) allErrorDetails.push(...res.data.errorDetails);
        } else {
          totalErrors += chunk.length;
          allErrorDetails.push(res?.data?.error || 'Erro no lote');
        }
      }

      if (totalErrors > 0 && allErrorDetails.length > 0) {
        toast.error(`${totalErrors} erros: ${allErrorDetails.slice(0, 3).join('; ')}`);
      }
      toast.success(`${totalSuccess} usuários cadastrados com sucesso!${totalErrors > 0 ? ` (${totalErrors} erros)` : ''}`);
      setShowBulkDialog(false);
      setBulkProgress(null);
      setBulkFile(null);
      setBulkUsers([]);
      setTimeout(fetchAll, 1500);
    } catch (err: any) {
      toast.error("Erro ao processar: " + (err?.message || ''));
      setBulkProgress(null);
    }
    setSubmitting(false);
  };

  const downloadTemplate = () => {
    const csv = "nome;email;senha;unidade;cargo;gestor_email\nJoão Silva;joao@fieac.org.br;Senha@123;SESI;Analista;;\nMaria Santos;maria@fieac.org.br;Senha@456;SENAI;Coordenador;;\nAna Lima;ana@fieac.org.br;Senha@789;SESI;Assistente;maria@fieac.org.br";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'template_usuarios.csv'; a.click();
  };

  const handleClearAllUsers = async () => {
    if (clearConfirmText !== 'CONFIRMAR') return;
    setSubmitting(true);
    const res = await invokeAdminFunction({ action: 'clear_all' });
    if (res?.error || res?.data?.error) {
      toast.error(res?.data?.error || "Erro ao limpar cadastros");
    } else {
      toast.success(`${res?.data?.deleted || 0} usuários removidos. Seu acesso foi preservado.`);
      setShowClearDialog(false);
      setClearConfirmText('');
      setTimeout(fetchAll, 1000);
    }
    setSubmitting(false);
  };

  const handleGoalUpdate = async (unit: string, hours: number) => {
    const { data: existing } = await supabase.from("unit_goals").select("id").eq("unit", unit);
    if (existing && existing.length > 0) {
      await supabase.from("unit_goals").update({ goal_hours: hours }).eq("unit", unit);
    } else {
      await supabase.from("unit_goals").insert({ unit, goal_hours: hours });
    }
    toast.success(`Meta do ${unit} atualizada para ${hours}h`);
    setGoals(prev => ({ ...prev, [unit]: hours }));
  };

  const viewCertFile = async (fileUrl: string | null) => {
    if (!fileUrl) { toast.error("Nenhum arquivo anexado"); return; }
    const { data } = await supabase.storage.from("certificates").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    else toast.error("Erro ao abrir arquivo");
  };

  const exportUsers = () => {
    const header = "Nome;Email;Unidade;Área;Horas;Cargo;Visível no Ranking";
    const rows = profiles.map(p =>
      `${p.name};${p.email};${p.unit};${p.area};${Number(p.total_hours)};${getUserRole(p.id)};${p.visible_in_ranking ? 'Sim' : 'Não'}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `usuarios_saber_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const handleSaveSupportConfig = () => {
    localStorage.setItem('saber_support_config', JSON.stringify(supportForm));
    toast.success("Configurações de suporte salvas!");
    setShowSupportDialog(false);
  };

  const coursePopularity = courses.map(c => ({
    ...c,
    completions: certs.filter(cert => cert.title === c.title && cert.status === 'approved').length,
  })).sort((a, b) => b.completions - a.completions);

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
    { key: 'reports' as const, label: 'Relatórios' },
    { key: 'support' as const, label: 'Suporte' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Painel Administrativo</h2>
            <p className="text-muted-foreground text-sm">Gerencie colaboradores, certificados, cursos e metas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Usuário</DialogTitle><DialogDescription>Preencha os dados do novo colaborador.</DialogDescription></DialogHeader>
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
                      <Label>Área / Cargo</Label>
                      <Input value={userForm.area} onChange={e => setUserForm({ ...userForm, area: e.target.value })} placeholder="Ex: Analista de TI" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tipo de Acesso</Label>
                      <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Colaborador</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gestor Responsável</Label>
                      <Select value={userForm.manager_id || '__none__'} onValueChange={v => setUserForm({ ...userForm, manager_id: v === '__none__' ? '' : v })}>
                        <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum</SelectItem>
                          {profiles.filter(p => roles.some(r => r.user_id === p.id && (r.role === 'gestor' || r.role === 'admin'))).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                <DialogHeader><DialogTitle>Importar Usuários em Massa</DialogTitle><DialogDescription>Envie um CSV com os dados dos colaboradores. Suporta até 1000+ usuários.</DialogDescription></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Formato: <code className="bg-muted px-1 rounded">nome;email;senha;unidade;cargo</code>
                  </p>
                  <Button variant="outline" className="gap-2 w-full" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" /> Baixar Template
                  </Button>
                  <div className="space-y-2">
                    <Label>Arquivo CSV</Label>
                    <Input type="file" accept=".csv" onChange={handleBulkUpload} disabled={submitting} />
                  </div>
                  {bulkProgress && (
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-sm font-medium text-foreground">{bulkProgress.status}</p>
                      <p className="text-xs text-muted-foreground mt-1">{bulkProgress.total} usuários no arquivo</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" className="gap-2" onClick={() => setShowClearDialog(true)}>
              <Trash2 className="h-4 w-4" /> Limpar Cadastros
            </Button>
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
              <Users className="h-5 w-5" /> Colaboradores ({profiles.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-2 font-medium text-muted-foreground hidden md:table-cell">E-mail</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Unidade</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Cargo</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Horas</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Ranking</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(user => {
                    const role = getUserRole(user.id);
                    return (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">{user.name.charAt(0)}</span>
                              </div>
                            )}
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground hidden md:table-cell">{user.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${user.unit.toLowerCase()}`}>{user.unit}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-red-500/10 text-red-600' : role === 'gestor' ? 'bg-violet-500/10 text-violet-600' : 'bg-muted text-muted-foreground'}`}>
                            {role === 'admin' ? 'Admin' : role === 'gestor' ? 'Gestor' : 'Colaborador'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => { setEditHoursUser(user); setEditHoursValue(String(Number(user.total_hours))); setShowEditHoursDialog(true); }}
                            className="font-heading font-semibold text-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Editar horas"
                          >
                            {Number(user.total_hours)}h
                            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </button>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleRanking(user.id, user.visible_in_ranking)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${user.visible_in_ranking ? 'bg-primary' : 'bg-muted'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${user.visible_in_ranking ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleImpersonate(user.id)} title="Ver dados do usuário" className="h-8 w-8 p-0">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Hours Dialog */}
        <Dialog open={showEditHoursDialog} onOpenChange={setShowEditHoursDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Horas - {editHoursUser?.name}</DialogTitle><DialogDescription>Ajuste o total de horas do colaborador.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Atual: {editHoursUser ? Number(editHoursUser.total_hours) : 0}h</p>
              <div className="space-y-2">
                <Label>Novo total de horas</Label>
                <Input type="number" value={editHoursValue} onChange={e => setEditHoursValue(e.target.value)} min={0} step={0.5} />
              </div>
              <Button onClick={handleEditHours} disabled={submitting} className="w-full gap-2">
                <Save className="h-4 w-4" /> {submitting ? 'Salvando...' : 'Salvar Horas'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                  <DialogHeader><DialogTitle>Adicionar Curso</DialogTitle><DialogDescription>Preencha os dados do novo curso.</DialogDescription></DialogHeader>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                            <SelectItem value="Compliance">Compliance</SelectItem>
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
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Imagem do Curso</Label>
                      <Input type="file" accept="image/*" onChange={e => setCourseImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={courseForm.is_compliance} onCheckedChange={v => setCourseForm({ ...courseForm, is_compliance: v })} />
                      <Label>Curso de Compliance</Label>
                    </div>
                    <Button onClick={handleAddCourse} disabled={submitting} className="w-full">
                      {submitting ? 'Criando...' : 'Criar Curso'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {courses.length === 0 && <p className="text-muted-foreground text-sm">Nenhum curso cadastrado</p>}
              {courses.map(course => (
                <div key={course.id} className="flex items-center gap-3 justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary/50" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.provider} · {course.hours}h · {course.competence} {course.is_compliance && '· 🛡️ Compliance'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${course.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      {course.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => openEditCourse(course)} title="Editar curso">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleCourse(course.id, course.active)}>
                      {course.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Course Dialog */}
        <Dialog open={showEditCourseDialog} onOpenChange={setShowEditCourseDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Curso</DialogTitle><DialogDescription>Modifique os dados do curso.</DialogDescription></DialogHeader>
            {editingCourse && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={editingCourse.title} onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={editingCourse.description || ''} onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Competência</Label>
                    <Select value={editingCourse.competence} onValueChange={v => setEditingCourse({ ...editingCourse, competence: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Digital">Digital</SelectItem>
                        <SelectItem value="Ambiental">Ambiental</SelectItem>
                        <SelectItem value="Inclusiva">Inclusiva</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horas</Label>
                    <Input type="number" value={editingCourse.hours} onChange={e => setEditingCourse({ ...editingCourse, hours: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Input value={editingCourse.provider || ''} onChange={e => setEditingCourse({ ...editingCourse, provider: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /> Link do Curso</Label>
                  <Input value={editingCourse.external_url} onChange={e => setEditingCourse({ ...editingCourse, external_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Nova Imagem (opcional)</Label>
                  <Input type="file" accept="image/*" onChange={e => setCourseImageFile(e.target.files?.[0] || null)} />
                  {editingCourse.image_url && !courseImageFile && (
                    <img src={editingCourse.image_url} alt="" className="h-16 w-16 rounded-lg object-cover mt-1" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingCourse.is_compliance} onCheckedChange={v => setEditingCourse({ ...editingCourse, is_compliance: v })} />
                  <Label>Curso de Compliance</Label>
                </div>
                <Button onClick={handleEditCourse} disabled={submitting} className="w-full gap-2">
                  <Save className="h-4 w-4" /> {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Goals Management */}
        {tab === 'goals' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" /> Metas por Unidade
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Defina as metas de horas de capacitação.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['SENAI', 'SESI', 'FIEAC', 'IEL'].map(unit => (
                <div key={unit} className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${unit.toLowerCase()}`}>{unit}</span>
                    <span className="text-sm font-medium text-foreground">Meta de Horas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="number" value={goals[unit] ?? 20} onChange={e => setGoals(prev => ({ ...prev, [unit]: parseInt(e.target.value) || 0 }))} className="w-24" min={1} />
                    <span className="text-sm text-muted-foreground">horas</span>
                    <Button size="sm" onClick={() => handleGoalUpdate(unit, goals[unit] ?? 20)}>Salvar</Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {profiles.filter(p => p.unit === unit).length} colaboradores · {profiles.filter(p => p.unit === unit && Number(p.total_hours) >= (goals[unit] ?? 20)).length} atingiram a meta
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Relatórios
              </h3>
              <div className="flex flex-wrap gap-3 mb-6">
                <Button onClick={exportUsers} className="gap-2">
                  <Download className="h-4 w-4" /> Exportar Base de Usuários (CSV)
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['SESI', 'SENAI', 'FIEAC', 'IEL'].map(unit => {
                  const unitUsers = profiles.filter(p => p.unit === unit);
                  const goalHours = goals[unit] ?? 20;
                  const metGoal = unitUsers.filter(u => Number(u.total_hours) >= goalHours).length;
                  return (
                    <div key={unit} className="rounded-xl bg-muted/50 p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${unit.toLowerCase()}`}>{unit}</span>
                      <p className="font-heading font-bold text-xl text-foreground mt-2">{metGoal}/{unitUsers.length}</p>
                      <p className="text-xs text-muted-foreground">atingiram a meta</p>
                      <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${unitUsers.length ? (metGoal / unitUsers.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <h4 className="font-heading font-semibold text-foreground mb-3">📊 Cursos Mais Realizados</h4>
              <div className="space-y-2">
                {coursePopularity.length === 0 && <p className="text-sm text-muted-foreground">Nenhum curso cadastrado</p>}
                {coursePopularity.slice(0, 10).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}°</span>
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.title} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-primary/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.competence} · {c.hours}h</p>
                    </div>
                    <span className="text-sm font-heading font-bold text-foreground">{c.completions} conclusões</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Support Config */}
        {tab === 'support' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> Configurações de Suporte
            </h3>
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>E-mail de Suporte</Label>
                <Input value={supportForm.email} onChange={e => setSupportForm({ ...supportForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone de Suporte</Label>
                <Input value={supportForm.phone} onChange={e => setSupportForm({ ...supportForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea value={supportForm.message} onChange={e => setSupportForm({ ...supportForm, message: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSaveSupportConfig} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Configurações
              </Button>
            </div>
          </div>
        )}

        {/* User Detail Dialog */}
        <Dialog open={showUserDetailDialog} onOpenChange={setShowUserDetailDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Detalhes do Colaborador</DialogTitle><DialogDescription>Informações e ações do colaborador.</DialogDescription></DialogHeader>
            {selectedUser && (() => {
              const userCerts = certs.filter(c => c.user_id === selectedUser.id);
              const approved = userCerts.filter(c => c.status === 'approved').length;
              const pending = userCerts.filter(c => c.status === 'pending').length;
              const rejected = userCerts.filter(c => c.status === 'rejected').length;
              const currentRole = getUserRole(selectedUser.id);
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-heading font-bold text-xl text-primary">{selectedUser.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-heading font-bold text-lg text-foreground">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${selectedUser.unit.toLowerCase()}`}>{selectedUser.unit}</span>
                        {selectedUser.area && <span className="text-xs text-muted-foreground">{selectedUser.area}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="font-heading font-bold text-xl text-foreground">{Number(selectedUser.total_hours)}h</p>
                      <p className="text-xs text-muted-foreground">Total de Horas</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="font-heading font-bold text-xl text-foreground">{approved}</p>
                      <p className="text-xs text-muted-foreground">Certificados Aprovados</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="font-heading font-bold text-xl text-amber-600">{pending}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="font-heading font-bold text-xl text-red-600">{rejected}</p>
                      <p className="text-xs text-muted-foreground">Reprovados</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Role Change */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Cargo / Tipo de Acesso</Label>
                      <Select value={currentRole} onValueChange={v => handleChangeRole(selectedUser.id, v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Colaborador</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Manager Assignment */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Gestor Responsável</Label>
                      <Select
                        value={selectedUser.manager_id || '__none__'}
                        onValueChange={v => assignManager(selectedUser.id, v === '__none__' ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Atribuir Gestor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sem gestor</SelectItem>
                          {profiles.filter(p => isUserGestor(p.id) || isUserAdmin(p.id)).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={() => handleLoginAsUser(selectedUser.id)} disabled={submitting} className="w-full gap-2">
                      <UserCheck className="h-4 w-4" /> {submitting ? 'Acessando...' : 'Entrar na Conta do Usuário'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => { setEditHoursUser(selectedUser); setEditHoursValue(String(Number(selectedUser.total_hours))); setShowEditHoursDialog(true); }} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Editar Horas
                      </Button>
                      <Button variant="outline" onClick={() => { setResetPwUser(selectedUser); setResetPwValue(''); }} className="gap-1">
                        <KeyRound className="h-3.5 w-3.5" /> Redefinir Senha
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={!!resetPwUser} onOpenChange={() => setResetPwUser(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Redefinir Senha</DialogTitle><DialogDescription>Defina uma nova senha para o colaborador.</DialogDescription></DialogHeader>
            {resetPwUser && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Nova senha para <strong>{resetPwUser.name}</strong></p>
                <Input
                  type="password"
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={resetPwValue}
                  onChange={e => setResetPwValue(e.target.value)}
                />
                <Button onClick={handleResetPassword} disabled={submitting || resetPwValue.length < 6} className="w-full gap-2">
                  <KeyRound className="h-4 w-4" /> {submitting ? 'Salvando...' : 'Salvar Nova Senha'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Credential Popup */}
        <Dialog open={!!credentialPopup} onOpenChange={() => setCredentialPopup(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>✅ Colaborador Cadastrado com Sucesso!</DialogTitle><DialogDescription>Envie as credenciais abaixo para o novo colaborador.</DialogDescription></DialogHeader>
            {credentialPopup && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Copie as informações abaixo e envie para o colaborador:</p>
                <div className="bg-muted rounded-xl p-4 space-y-1 text-sm font-mono">
                  <p>Olá {credentialPopup.name},</p>
                  <p className="mt-2">Seu acesso à plataforma <strong>Saber+</strong> foi criado!</p>
                  <p className="mt-2">📧 <strong>Login:</strong> {credentialPopup.email}</p>
                  <p>🔑 <strong>Senha provisória:</strong> {credentialPopup.password}</p>
                  <p className="mt-2">⚠️ Ao fazer o primeiro login, você será solicitado a criar uma nova senha.</p>
                  <p className="mt-2">Acesse: {window.location.origin}</p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    const text = `Olá ${credentialPopup.name},\n\nSeu acesso à plataforma Saber+ foi criado!\n\n📧 Login: ${credentialPopup.email}\n🔑 Senha provisória: ${credentialPopup.password}\n\n⚠️ Ao fazer o primeiro login, você será solicitado a criar uma nova senha.\n\nAcesse: ${window.location.origin}`;
                    navigator.clipboard.writeText(text);
                    toast.success("Texto copiado para a área de transferência!");
                  }}
                >
                  📋 Copiar Mensagem
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Clear All Users Dialog */}
        <Dialog open={showClearDialog} onOpenChange={v => { setShowClearDialog(v); setClearConfirmText(''); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Limpar Todos os Cadastros
              </DialogTitle>
              <DialogDescription>
                Esta ação é irreversível. Todos os usuários serão removidos, exceto o acesso principal (joao.ferreira@fieac.org.br).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para confirmar, digite <strong>CONFIRMAR</strong> abaixo:
              </p>
              <Input
                value={clearConfirmText}
                onChange={e => setClearConfirmText(e.target.value)}
                placeholder="Digite CONFIRMAR"
              />
              <Button
                variant="destructive"
                onClick={handleClearAllUsers}
                disabled={submitting || clearConfirmText !== 'CONFIRMAR'}
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" /> {submitting ? 'Removendo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
