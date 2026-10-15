import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Users, TrendingUp, FileText, Clock, Plus, BookOpen, Link as LinkIcon, Target, Upload, Download, Eye, BarChart3, Image, UserCheck, Pencil, Save, HelpCircle, KeyRound, Trash2, AlertTriangle, UserCog, UsersRound, X, Mail, Check, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandingEditor } from "@/components/BrandingEditor";

interface Profile {
  id: string; name: string; email: string; unit: string; area: string; total_hours: number; avatar_url: string | null; visible_in_ranking: boolean; manager_id: string | null;
}
interface Cert {
  id: string; user_id: string; title: string; hours: number; competence: string; status: string; created_at: string; file_url: string | null;
}
interface Course {
  id: string; title: string; description: string; competence: string; hours: number; provider: string; external_url: string; active: boolean; image_url: string | null; is_compliance: boolean; compliance_category?: string | null; campaign_month?: number | null;
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
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Diálogos e Modais
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false);
  const [showEditHoursDialog, setShowEditHoursDialog] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [showUserDetailDialog, setShowUserDetailDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // Seleções e Edições
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editHoursUser, setEditHoursUser] = useState<Profile | null>(null);
  const [editHoursValue, setEditHoursValue] = useState('');
  const [courseForm, setCourseForm] = useState({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '', image_url: '', is_compliance: false, compliance_category: '', campaign_month: '' });
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', unit: 'FIEAC', area: '', role: 'user', manager_id: '' });
  const [tab, setTab] = useState<'overview' | 'certs' | 'courses' | 'goals' | 'reports' | 'support' | 'branding'>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({ email: 'suporte@fieac.org.br', phone: '(68) 3212-4200', message: 'Precisa de ajuda? Entre em contato com o suporte do Sistema FIEAC.' });
  const [resetPwUser, setResetPwUser] = useState<Profile | null>(null);
  const [resetPwValue, setResetPwValue] = useState('');
  const [credentialPopup, setCredentialPopup] = useState<{ name: string; email: string; password: string } | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ total: number; status: string } | null>(null);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkManagerId, setBulkManagerId] = useState<string>('');

  // Filtros Avançados
  const [userSearch, setUserSearch] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  const fetchAll = async () => {
    try {
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
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setIsLoadingData(false);
    }
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
    try {
      const token = await getAuthToken();
      const res = await supabase.functions.invoke('admin-create-user', {
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.error) {
        let errorMsg = res.error.message;
        try {
          const jsonBody = await (res.error as any).context?.json();
          if (jsonBody?.error) errorMsg = jsonBody.error;
        } catch {}
        return { error: { message: errorMsg }, data: null };
      }

      return res;
    } catch (err: any) {
      console.error("Erro ao invocar Edge Function:", err);
      return { error: err, data: null };
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setSubmitting(true);
    try {
      const res = await invokeAdminFunction({ action: 'change_role', user_id: userId, new_role: newRole });
      if (res?.error || res?.data?.error) {
        toast.error(res?.data?.error || res?.error?.message || "Erro ao alterar cargo");
      } else {
        toast.success(`Cargo alterado para ${newRole === 'admin' ? 'Administrador' : newRole === 'gestor' ? 'Gestor' : 'Colaborador'}`);
        await fetchAll();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      const res = await invokeAdminFunction({ action: 'delete_single', user_id: userToDelete.id });
      if (res?.error || res?.data?.error) {
        toast.error(res?.data?.error || res?.error?.message || "Erro ao excluir colaborador");
      } else {
        toast.success(`Colaborador ${userToDelete.name} excluído com sucesso!`);
        setShowDeleteUserDialog(false);
        setShowUserDetailDialog(false);
        setUserToDelete(null);
        setSelectedIds(prev => prev.filter(id => id !== userToDelete.id));
        await fetchAll();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const assignManager = async (userId: string, managerId: string | null) => {
    await supabase.from("profiles").update({ manager_id: managerId } as any).eq("id", userId);
    toast.success(managerId ? "Gestor atribuído" : "Gestor removido");
    fetchAll();
  };

  // ===== Operações em Massa =====
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkPromoteToGestor = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      let success = 0, errors = 0;
      for (const userId of selectedIds) {
        const res = await invokeAdminFunction({ action: 'change_role', user_id: userId, new_role: 'gestor' });
        if (res?.error || res?.data?.error) errors++; else success++;
      }
      toast.success(`${success} promovidos a Gestor${errors > 0 ? ` · ${errors} erros` : ''}`);
      clearSelection();
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDemoteToUser = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      let success = 0, errors = 0;
      for (const userId of selectedIds) {
        const res = await invokeAdminFunction({ action: 'change_role', user_id: userId, new_role: 'user' });
        if (res?.error || res?.data?.error) errors++; else success++;
      }
      toast.success(`${success} alterados para Colaborador${errors > 0 ? ` · ${errors} erros` : ''}`);
      clearSelection();
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAssignManager = async () => {
    if (selectedIds.length === 0) { toast.error("Selecione ao menos um colaborador"); return; }
    const managerId = bulkManagerId === '__none__' ? null : bulkManagerId;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ manager_id: managerId } as any)
        .in("id", selectedIds);
      if (error) {
        toast.error("Erro ao atribuir gestor em massa");
      } else {
        const managerName = managerId ? profiles.find(p => p.id === managerId)?.name : null;
        toast.success(managerId
          ? `${selectedIds.length} colaboradores vinculados a ${managerName}`
          : `${selectedIds.length} colaboradores desvinculados de seus gestores`);
        setShowBulkAssignDialog(false);
        setBulkManagerId('');
        clearSelection();
        await fetchAll();
      }
    } finally {
      setSubmitting(false);
    }
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
          try {
            const { checkAndUnlockComplianceBadges } = await import("@/lib/compliance-badges");
            await checkAndUnlockComplianceBadges(cert.user_id);
          } catch (e) { console.error(e); }
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
      compliance_category: courseForm.is_compliance ? (courseForm.compliance_category || null) : null,
      campaign_month: courseForm.is_compliance && courseForm.compliance_category === 'campanha' && courseForm.campaign_month ? parseInt(courseForm.campaign_month) : null,
    });
    if (error) { toast.error("Erro ao criar curso"); } else {
      toast.success("Curso criado!");
      setCourseForm({ title: '', description: '', competence: 'Digital', hours: '1', provider: '', external_url: '', image_url: '', is_compliance: false, compliance_category: '', campaign_month: '' });
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
      compliance_category: editingCourse.is_compliance ? (editingCourse.compliance_category || null) : null,
      campaign_month: editingCourse.is_compliance && editingCourse.compliance_category === 'campanha' ? (editingCourse.campaign_month || null) : null,
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
      const res = await invokeAdminFunction({
        action: 'impersonate_user',
        user_id: userId,
      });

      if (res?.error || res?.data?.error) {
        toast.error(res?.data?.error || res?.error?.message || "Erro ao acessar conta");
      } else if (res?.data?.url) {
        toast.success(`Abrindo conta de ${user.name}...`);
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error("O link de acesso não foi retornado pelo servidor.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao acessar conta do usuário");
    } finally {
      setSubmitting(false);
    }
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
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCourse = async (id: string, active: boolean) => {
    await supabase.from("courses").update({ active: !active }).eq("id", id);
    fetchAll();
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSubmitting(true);
    try {
      const res = await invokeAdminFunction({
        action: 'create_single',
        email: userForm.email.trim(),
        password: userForm.password,
        name: userForm.name.trim(),
        unit: userForm.unit,
        area: userForm.area.trim(),
        role: userForm.role,
        manager_id: userForm.manager_id || undefined,
      });

      if (res?.error || res?.data?.error) {
        toast.error(res?.data?.error || res?.error?.message || "Erro ao cadastrar usuário");
      } else {
        toast.success("Usuário cadastrado com sucesso!");
        setCredentialPopup({ name: userForm.name, email: userForm.email, password: userForm.password });
        setUserForm({ name: '', email: '', password: '', unit: 'FIEAC', area: '', role: 'user', manager_id: '' });
        setShowUserDialog(false);
        await fetchAll();
      }
    } catch (err: any) {
      toast.error(err?.message || "Ocorreu uma falha inesperada na requisição");
    } finally {
      setSubmitting(false);
    }
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
      let totalSuccess = 0, totalErrors = 0, totalSkipped = 0;
      const allErrorDetails: string[] = [];
      const chunkSize = 25;

      for (let i = 0; i < bulkUsers.length; i += chunkSize) {
        const chunk = bulkUsers.slice(i, i + chunkSize);
        setBulkProgress({ total: bulkUsers.length, status: `Processando ${i + 1}-${Math.min(i + chunkSize, bulkUsers.length)} de ${bulkUsers.length}...` });
        
        const res = await invokeAdminFunction({ action: 'bulk_create', users: chunk });
        if (res?.data && !res?.data?.error) {
          totalSuccess += res.data.success || 0;
          totalErrors += res.data.errors || 0;
          totalSkipped += res.data.skipped || 0;
          if (res.data.errorDetails) allErrorDetails.push(...res.data.errorDetails);
        } else {
          totalErrors += chunk.length;
          allErrorDetails.push(res?.data?.error || 'Erro no lote');
        }
      }

      if (totalErrors > 0 && allErrorDetails.length > 0) {
        toast.error(`${totalErrors} erros: ${allErrorDetails.slice(0, 3).join('; ')}`);
      }
      const parts = [`${totalSuccess} cadastrados`];
      if (totalSkipped > 0) parts.push(`${totalSkipped} já existiam`);
      if (totalErrors > 0) parts.push(`${totalErrors} erros`);
      toast.success(parts.join(' · '));
      setShowBulkDialog(false);
      setBulkProgress(null);
      setBulkFile(null);
      setBulkUsers([]);
      setTimeout(fetchAll, 1500);
    } catch (err: any) {
      toast.error("Erro ao processar: " + (err?.message || ''));
      setBulkProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "nome;email;senha;unidade;cargo;gestor_email\nJoão Silva;joao@fieac.org.br;Senha@123;SESI;Analista;;\nMaria Santos;maria@fieac.org.br;Senha@456;SENAI;Coordenador;;\nAna Lima;ana@fieac.org.br;Senha@789;SESI;Assistente;maria@fieac.org.br";
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'template_usuarios.csv'; a.click();
  };

  const handleClearAllUsers = async () => {
    if (clearConfirmText !== 'CONFIRMAR') return;
    setSubmitting(true);
    try {
      const res = await invokeAdminFunction({ action: 'clear_all' });
      if (res?.error || res?.data?.error) {
        toast.error(res?.data?.error || "Erro ao limpar cadastros");
      } else {
        toast.success(`${res?.data?.deleted || 0} usuários removidos. Seu acesso foi preservado.`);
        setShowClearDialog(false);
        setClearConfirmText('');
        setTimeout(fetchAll, 1000);
      }
    } finally {
      setSubmitting(false);
    }
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
    const { data } = await supabase.storage.from("certificates").createSignedUrl(fileUrl, 604800);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    else toast.error("Erro ao abrir arquivo");
  };

  // Exportação com UTF-8 BOM para garantir compatibilidade com Microsoft Excel
  const exportUsers = () => {
    const header = "Nome;Email;Unidade;Área;Horas;Cargo;Visível no Ranking";
    const rows = profiles.map(p =>
      `${p.name};${p.email};${p.unit};${p.area};${Number(p.total_hours)};${getUserRole(p.id)};${p.visible_in_ranking ? 'Sim' : 'Não'}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `usuarios_saber_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const handleSaveSupportConfig = () => {
    localStorage.setItem('saber_support_config', JSON.stringify(supportForm));
    toast.success("Configurações de suporte salvas!");
    setShowSupportDialog(false);
  };

  // Envio de credenciais por E-mail
  const handleSendCredentialsEmail = () => {
    if (!credentialPopup) return;
    const subject = encodeURIComponent("Seu Acesso à Plataforma Saber+");
    const body = encodeURIComponent(
      `Olá, ${credentialPopup.name}!\n\n` +
      `Seu acesso à plataforma corporativa Saber+ foi criado com sucesso.\n\n` +
      `📧 E-mail de Acesso: ${credentialPopup.email}\n` +
      `🔑 Senha Provisória: ${credentialPopup.password}\n\n` +
      `⚠️ No seu primeiro acesso, você poderá atualizar para a senha de sua preferência.\n\n` +
      `Acesse agora através do link:\n${window.location.origin}\n\n` +
      `Atenciosamente,\nEquipe de Gestão e Desenvolvimento Humano`
    );
    window.location.href = `mailto:${credentialPopup.email}?subject=${subject}&body=${body}`;
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
    { key: 'branding' as const, label: '🎨 Personalização' },
  ];

  // Filtros combinados da tabela
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q) || (p.area && p.area.toLowerCase().includes(q));
      const matchesUnit = selectedUnitFilter === 'ALL' || p.unit === selectedUnitFilter;
      const userRole = getUserRole(p.id);
      const matchesRole = selectedRoleFilter === 'ALL' || userRole === selectedRoleFilter;
      return matchesSearch && matchesUnit && matchesRole;
    });
  }, [profiles, userSearch, selectedUnitFilter, selectedRoleFilter, roles]);

  const filteredIds = useMemo(() => filteredProfiles.map(p => p.id), [filteredProfiles]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
  const someFilteredSelected = filteredIds.some(id => selectedIds.includes(id));
  const selectedAreAllUsers = selectedIds.length > 0 && selectedIds.every(id => getUserRole(id) === 'user');
  const selectedAreAllGestors = selectedIds.length > 0 && selectedIds.every(id => getUserRole(id) === 'gestor');

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Painel Administrativo</h2>
            <p className="text-muted-foreground text-sm">Gerencie colaboradores, certificados, cursos e metas de capacitação</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm"><Plus className="h-4 w-4" /> Novo Usuário</Button>
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
                    <Label>Senha inicial</Label>
                    <Input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder="Senha inicial (mín. 6 caracteres)" minLength={6} />
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

            <Dialog open={showBulkDialog} onOpenChange={v => { setShowBulkDialog(v); if (!v) { setBulkFile(null); setBulkUsers([]); setBulkProgress(null); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Importar CSV</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Importar Usuários em Massa</DialogTitle><DialogDescription>Envie um CSV com os dados dos colaboradores. Suporta 500+ usuários.</DialogDescription></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Formato: <code className="bg-muted px-1 rounded">nome;email;senha;unidade;cargo</code>
                  </p>
                  <Button variant="outline" className="gap-2 w-full" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" /> Baixar Template (CSV com Acentos)
                  </Button>
                  <div className="space-y-2">
                    <Label>Arquivo CSV</Label>
                    <Input type="file" accept=".csv,.txt" onChange={handleBulkFileSelect} disabled={submitting} />
                  </div>
                  {bulkUsers.length > 0 && !bulkProgress && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-center space-y-2">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">✅ {bulkUsers.length} usuários prontos para cadastrar</p>
                      <Button onClick={handleBulkUpload} disabled={submitting} className="w-full gap-2">
                        <Upload className="h-4 w-4" /> Cadastrar Todos ({bulkUsers.length})
                      </Button>
                    </div>
                  )}
                  {bulkProgress && (
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-sm font-medium text-foreground">{bulkProgress.status}</p>
                      <p className="text-xs text-muted-foreground mt-1">{bulkProgress.total} usuários no total</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" className="gap-2" onClick={() => setShowClearDialog(true)}>
              <Trash2 className="h-4 w-4" /> Limpar Base
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-4 shadow-sm border">
              <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
              <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs de Navegação */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/70 text-muted-foreground hover:bg-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview - Tabela de Colaboradores */}
        {tab === 'overview' && (
          <div className="glass-card rounded-2xl p-6 shadow-sm border space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Colaboradores ({filteredProfiles.length} de {profiles.length})
              </h3>
              <Input
                placeholder="Buscar por nome, e-mail, área..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="max-w-xs h-9 text-sm"
              />
            </div>

            {/* Chips de Filtros Rápidos (Unidades e Perfis) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Unidade:
              </span>
              {['ALL', 'SESI', 'SENAI', 'FIEAC', 'IEL'].map(u => (
                <button
                  key={u}
                  onClick={() => setSelectedUnitFilter(u)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${selectedUnitFilter === u ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {u === 'ALL' ? 'Todas' : u}
                </button>
              ))}

              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 ml-3 mr-1">
                Cargo:
              </span>
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'user', label: 'Colaboradores' },
                { key: 'gestor', label: 'Gestores' },
                { key: 'admin', label: 'Admins' },
              ].map(r => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRoleFilter(r.key)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${selectedRoleFilter === r.key ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Barra de Ações em Massa */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
                    </span>
                    <Button size="sm" variant="ghost" onClick={clearSelection} className="h-7 gap-1 text-xs">
                      <X className="h-3 w-3" /> Limpar
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkPromoteToGestor}
                      disabled={submitting || !selectedAreAllUsers}
                      title={!selectedAreAllUsers ? 'Selecione apenas Colaboradores para promover' : ''}
                      className="gap-1.5 text-violet-600 hover:bg-violet-500/10 border-violet-500/30 h-8 text-xs"
                    >
                      <UserCog className="h-3.5 w-3.5" /> Promover a Gestor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDemoteToUser}
                      disabled={submitting || !selectedAreAllGestors}
                      title={!selectedAreAllGestors ? 'Selecione apenas Gestores para rebaixar' : ''}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Users className="h-3.5 w-3.5" /> Rebaixar a Colaborador
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setBulkManagerId(''); setShowBulkAssignDialog(true); }}
                      disabled={submitting}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <UsersRound className="h-3.5 w-3.5" /> Atribuir Gestor
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2.5 w-10">
                      <Checkbox
                        checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
                        onCheckedChange={() => toggleSelectAll(filteredIds)}
                        aria-label="Selecionar todos"
                      />
                    </th>
                    <th className="text-left py-2.5 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-2.5 font-medium text-muted-foreground hidden md:table-cell">E-mail</th>
                    <th className="text-left py-2.5 font-medium text-muted-foreground">Unidade</th>
                    <th className="text-left py-2.5 font-medium text-muted-foreground">Cargo</th>
                    <th className="text-left py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Gestor</th>
                    <th className="text-right py-2.5 font-medium text-muted-foreground">Horas</th>
                    <th className="text-center py-2.5 font-medium text-muted-foreground">Ranking</th>
                    <th className="text-right py-2.5 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingData ? (
                    // Skeleton Screens elegantes durante o carregamento
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-0 animate-pulse">
                        <td className="py-3.5"><div className="h-4 w-4 bg-muted rounded" /></td>
                        <td className="py-3.5"><div className="h-4 w-36 bg-muted rounded" /></td>
                        <td className="py-3.5 hidden md:table-cell"><div className="h-4 w-44 bg-muted rounded" /></td>
                        <td className="py-3.5"><div className="h-4 w-14 bg-muted rounded-full" /></td>
                        <td className="py-3.5"><div className="h-4 w-16 bg-muted rounded-full" /></td>
                        <td className="py-3.5 hidden lg:table-cell"><div className="h-4 w-24 bg-muted rounded" /></td>
                        <td className="py-3.5 text-right"><div className="h-4 w-10 bg-muted rounded ml-auto" /></td>
                        <td className="py-3.5 text-center"><div className="h-5 w-9 bg-muted rounded-full mx-auto" /></td>
                        <td className="py-3.5 text-right"><div className="h-7 w-16 bg-muted rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    filteredProfiles.map(user => {
                      const role = getUserRole(user.id);
                      const checked = selectedIds.includes(user.id);
                      const managerName = user.manager_id ? profiles.find(p => p.id === user.manager_id)?.name : null;
                      const userGoal = goals[user.unit] ?? 20;
                      const hasMetGoal = Number(user.total_hours) >= userGoal;

                      return (
                        <tr key={user.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${checked ? 'bg-primary/5' : ''}`}>
                          <td className="py-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleSelect(user.id)}
                              aria-label={`Selecionar ${user.name}`}
                            />
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary">{user.name.charAt(0)}</span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{user.name}</span>
                                {user.area && <span className="text-[11px] text-muted-foreground">{user.area}</span>}
                              </div>
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
                          <td className="py-3 text-muted-foreground text-xs hidden lg:table-cell">
                            {managerName || <span className="opacity-40">—</span>}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex flex-col items-end">
                              <button
                                onClick={() => { setEditHoursUser(user); setEditHoursValue(String(Number(user.total_hours))); setShowEditHoursDialog(true); }}
                                className="font-heading font-semibold text-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Editar horas"
                              >
                                {Number(user.total_hours)}h
                                <Pencil className="h-3 w-3 opacity-40 hover:opacity-100" />
                              </button>
                              {hasMetGoal && (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <Check className="h-2.5 w-2.5" /> Meta
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => toggleRanking(user.id, user.visible_in_ranking)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${user.visible_in_ranking ? 'bg-primary' : 'bg-muted'}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${user.visible_in_ranking ? 'translate-x-4' : 'translate-x-1'}`} />
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleImpersonate(user.id)} title="Ver detalhes e gerenciar" className="h-8 w-8 p-0">
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setUserToDelete(user); setShowDeleteUserDialog(true); }} 
                                title="Excluir colaborador" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {!isLoadingData && filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum colaborador encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Exclusão Individual */}
        <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Excluir Colaborador
              </DialogTitle>
              <DialogDescription>
                Tem certeza de que deseja excluir permanentemente o cadastro de <strong>{userToDelete?.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-destructive/10 text-xs text-destructive space-y-1">
                <p>• O acesso de login deste usuário será completamente revogado no Auth.</p>
                <p>• Se este usuário era gestor de outros colaboradores, eles ficarão sem gestor.</p>
                <p>• Esta ação não pode ser desfeita.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDeleteUserDialog(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={submitting} className="gap-2">
                  <Trash2 className="h-4 w-4" /> {submitting ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Credenciais com Envio por E-mail */}
        <Dialog open={!!credentialPopup} onOpenChange={() => setCredentialPopup(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" /> Colaborador Cadastrado!
              </DialogTitle>
              <DialogDescription>
                Envie as credenciais abaixo para que o colaborador acerte seu primeiro acesso.
              </DialogDescription>
            </DialogHeader>
            {credentialPopup && (
              <div className="space-y-4">
                <div className="bg-muted rounded-xl p-4 space-y-1 text-sm font-mono border">
                  <p>Olá <strong>{credentialPopup.name}</strong>,</p>
                  <p className="mt-2">Seu acesso à plataforma <strong>Saber+</strong> foi criado!</p>
                  <p className="mt-2">📧 <strong>Login:</strong> {credentialPopup.email}</p>
                  <p>🔑 <strong>Senha provisória:</strong> {credentialPopup.password}</p>
                  <p className="mt-2 text-xs text-muted-foreground">⚠️ Ao fazer o primeiro login, altere sua senha no menu de perfil.</p>
                  <p className="mt-2 text-xs text-primary font-semibold">Acesse: {window.location.origin}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 text-xs"
                    onClick={() => {
                      const text = `Olá ${credentialPopup.name},\n\nSeu acesso à plataforma Saber+ foi criado!\n\n📧 Login: ${credentialPopup.email}\n🔑 Senha provisória: ${credentialPopup.password}\n\n⚠️ Ao fazer o primeiro login, você será solicitado a criar uma nova senha.\n\nAcesse: ${window.location.origin}`;
                      navigator.clipboard.writeText(text);
                      toast.success("Mensagem copiada para a área de transferência!");
                    }}
                  >
                    📋 Copiar Texto
                  </Button>
                  <Button
                    className="gap-2 text-xs bg-primary hover:bg-primary/90"
                    onClick={handleSendCredentialsEmail}
                  >
                    <Mail className="h-4 w-4" /> Enviar por E-mail
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Atribuir Gestor em Massa */}
        <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" /> Atribuir Gestor em Massa
              </DialogTitle>
              <DialogDescription>
                {selectedIds.length} colaborador{selectedIds.length > 1 ? 'es' : ''} será{selectedIds.length > 1 ? 'ão' : ''} vinculado{selectedIds.length > 1 ? 's' : ''} ao gestor escolhido.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Gestor Responsável</Label>
                <Select value={bulkManagerId || '__placeholder__'} onValueChange={v => setBulkManagerId(v === '__placeholder__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um gestor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Remover gestor (sem gestor) —</SelectItem>
                    {profiles
                      .filter(p => isUserGestor(p.id) || isUserAdmin(p.id))
                      .filter(p => !selectedIds.includes(p.id))
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.unit}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">Colaboradores selecionados:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIds.slice(0, 30).map(id => {
                    const p = profiles.find(x => x.id === id);
                    if (!p) return null;
                    return (
                      <span key={id} className="px-2 py-0.5 rounded-full bg-background text-xs border">
                        {p.name}
                      </span>
                    );
                  })}
                  {selectedIds.length > 30 && (
                    <span className="px-2 py-0.5 rounded-full bg-background text-xs border text-muted-foreground">
                      +{selectedIds.length - 30}
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleBulkAssignManager}
                disabled={submitting || !bulkManagerId}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {submitting ? 'Salvando...' : `Confirmar para ${selectedIds.length} colaborador${selectedIds.length > 1 ? 'es' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Horas */}
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

        {/* Modal de Detalhes do Usuário */}
        <Dialog open={showUserDetailDialog} onOpenChange={setShowUserDetailDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Detalhes do Colaborador</DialogTitle><DialogDescription>Edite informações e gerencie o colaborador.</DialogDescription></DialogHeader>
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
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* Editar Perfil */}
                  <div className="space-y-3 p-3 rounded-xl bg-muted/30 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Perfil</p>
                    <div className="space-y-2">
                      <Label className="text-xs">Nome</Label>
                      <Input value={selectedUser.name} onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Unidade</Label>
                        <Select value={selectedUser.unit} onValueChange={v => setSelectedUser({ ...selectedUser, unit: v })}>
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
                        <Label className="text-xs">Área / Cargo</Label>
                        <Input value={selectedUser.area} onChange={e => setSelectedUser({ ...selectedUser, area: e.target.value })} />
                      </div>
                    </div>
                    <Button size="sm" onClick={async () => {
                      const { error } = await supabase.from("profiles").update({
                        name: selectedUser.name,
                        unit: selectedUser.unit,
                        area: selectedUser.area,
                      } as any).eq("id", selectedUser.id);
                      if (error) toast.error("Erro ao salvar perfil");
                      else { toast.success("Perfil atualizado!"); fetchAll(); }
                    }} disabled={submitting} className="w-full gap-2">
                      <Save className="h-3.5 w-3.5" /> Salvar Perfil
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="font-heading font-bold text-xl text-foreground">{Number(selectedUser.total_hours)}h</p>
                      <p className="text-xs text-muted-foreground">Total de Horas</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="font-heading font-bold text-xl text-foreground">{approved}</p>
                      <p className="text-xs text-muted-foreground">Aprovados</p>
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
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Cargo / Tipo de Acesso</Label>
                      <Select value={currentRole} onValueChange={v => handleChangeRole(selectedUser.id, v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Colaborador</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Gestor Responsável</Label>
                      <Select
                        value={selectedUser.manager_id || '__none__'}
                        onValueChange={v => assignManager(selectedUser.id, v === '__none__' ? null : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Atribuir Gestor" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sem gestor</SelectItem>
                          {profiles.filter(p => isUserGestor(p.id) || isUserAdmin(p.id)).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={() => handleLoginAsUser(selectedUser.id)} disabled={submitting} className="w-full gap-2 mt-1">
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
                    <Button 
                      variant="destructive" 
                      onClick={() => { setUserToDelete(selectedUser); setShowDeleteUserDialog(true); }} 
                      disabled={submitting} 
                      className="w-full gap-2 mt-2"
                    >
                      <Trash2 className="h-4 w-4" /> Excluir este Colaborador
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Modal Redefinir Senha */}
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

        {/* Modal Limpar Toda a Base */}
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

        {/* Gestão de Certificados */}
        {tab === 'certs' && (
          <div className="glass-card rounded-2xl p-6 border shadow-sm">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Todos os Certificados
            </h3>
            <div className="space-y-3">
              {certs.length === 0 && <p className="text-muted-foreground text-sm">Nenhum certificado registrado no momento.</p>}
              {certs.map(cert => {
                const userName = profiles.find(p => p.id === cert.user_id)?.name || 'Usuário';
                return (
                  <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 gap-3 border">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{cert.title}</p>
                      <p className="text-xs text-muted-foreground">{userName} · {cert.hours}h · {cert.competence} · {new Date(cert.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cert.file_url && (
                        <Button size="sm" variant="ghost" onClick={() => viewCertFile(cert.file_url)} className="gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" /> Ver PDF
                        </Button>
                      )}
                      {cert.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50 gap-1 text-xs" onClick={() => handleCertAction(cert.id, 'approved')}>
                            <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 gap-1 text-xs" onClick={() => handleCertAction(cert.id, 'rejected')}>
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

        {/* Gestão de Cursos */}
        {tab === 'courses' && (
          <div className="glass-card rounded-2xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Catálogo de Cursos
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
                      <Input value={courseForm.provider} onChange={e => setCourseForm({ ...courseForm, provider: e.target.value })} placeholder="Ex: Coursera, FGV, Senai Play" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /> Link do Curso</Label>
                      <Input value={courseForm.external_url} onChange={e => setCourseForm({ ...courseForm, external_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Imagem de Capa</Label>
                      <Input type="file" accept="image/*" onChange={e => setCourseImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={courseForm.is_compliance} onCheckedChange={v => setCourseForm({ ...courseForm, is_compliance: v, compliance_category: v ? courseForm.compliance_category : '', campaign_month: v ? courseForm.campaign_month : '' })} />
                      <Label>Curso de Compliance</Label>
                    </div>
                    {courseForm.is_compliance && (
                      <div className="space-y-2 pl-2 border-l-2 border-amber-500/30">
                        <Label className="text-xs text-amber-700">Categoria de Compliance</Label>
                        <Select value={courseForm.compliance_category} onValueChange={v => setCourseForm({ ...courseForm, compliance_category: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="introdutorio">📘 Introdutório</SelectItem>
                            <SelectItem value="obrigatorio">⚠️ Obrigatório (LGPD, Assédio, Ética...)</SelectItem>
                            <SelectItem value="campanha">📅 Campanha mensal</SelectItem>
                          </SelectContent>
                        </Select>
                        {courseForm.compliance_category === 'campanha' && (
                          <Select value={courseForm.campaign_month} onValueChange={v => setCourseForm({ ...courseForm, campaign_month: v })}>
                            <SelectTrigger><SelectValue placeholder="Mês da campanha" /></SelectTrigger>
                            <SelectContent>
                              {['Janeiro Branco','Fevereiro','Março','Abril Verde','Maio','Junho','Julho','Agosto','Setembro','Outubro Rosa','Novembro Azul','Dezembro'].map((m, i) => (
                                <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                    <Button onClick={handleAddCourse} disabled={submitting} className="w-full">
                      {submitting ? 'Criando...' : 'Criar Curso'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {courses.length === 0 && <p className="text-muted-foreground text-sm">Nenhum curso cadastrado.</p>}
              {courses.map(course => (
                <div key={course.id} className="flex items-center gap-3 justify-between p-3 rounded-xl bg-muted/40 border">
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

        {/* Modal Editar Curso */}
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
                  <Switch checked={editingCourse.is_compliance} onCheckedChange={v => setEditingCourse({ ...editingCourse, is_compliance: v, compliance_category: v ? editingCourse.compliance_category : null, campaign_month: v ? editingCourse.campaign_month : null })} />
                  <Label>Curso de Compliance</Label>
                </div>
                {editingCourse.is_compliance && (
                  <div className="space-y-2 pl-2 border-l-2 border-amber-500/30">
                    <Label className="text-xs text-amber-700">Categoria de Compliance</Label>
                    <Select value={editingCourse.compliance_category || ''} onValueChange={v => setEditingCourse({ ...editingCourse, compliance_category: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="introdutorio">📘 Introdutório</SelectItem>
                        <SelectItem value="obrigatorio">⚠️ Obrigatório</SelectItem>
                        <SelectItem value="campanha">📅 Campanha mensal</SelectItem>
                      </SelectContent>
                    </Select>
                    {editingCourse.compliance_category === 'campanha' && (
                      <Select value={String(editingCourse.campaign_month || '')} onValueChange={v => setEditingCourse({ ...editingCourse, campaign_month: parseInt(v) })}>
                        <SelectTrigger><SelectValue placeholder="Mês da campanha" /></SelectTrigger>
                        <SelectContent>
                          {['Janeiro Branco','Fevereiro','Março','Abril Verde','Maio','Junho','Julho','Agosto','Setembro','Outubro Rosa','Novembro Azul','Dezembro'].map((m, i) => (
                            <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                <Button onClick={handleEditCourse} disabled={submitting} className="w-full gap-2">
                  <Save className="h-4 w-4" /> {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Metas por Unidade */}
        {tab === 'goals' && (
          <div className="glass-card rounded-2xl p-6 border shadow-sm">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Metas por Unidade (Horas Anuais)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Defina as metas mínimas de capacitação para cada entidade do Sistema FIEAC.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['SENAI', 'SESI', 'FIEAC', 'IEL'].map(unit => (
                <div key={unit} className="p-4 rounded-xl bg-muted/40 space-y-3 border">
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

        {/* Relatórios */}
        {tab === 'reports' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border shadow-sm">
              <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Relatórios e Indicadores
              </h3>
              <div className="flex flex-wrap gap-3 mb-6">
                <Button onClick={exportUsers} className="gap-2 shadow-sm">
                  <Download className="h-4 w-4" /> Exportar Base Geral (CSV Excel)
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['SESI', 'SENAI', 'FIEAC', 'IEL'].map(unit => {
                  const unitUsers = profiles.filter(p => p.unit === unit);
                  const goalHours = goals[unit] ?? 20;
                  const metGoal = unitUsers.filter(u => Number(u.total_hours) >= goalHours).length;
                  return (
                    <div key={unit} className="rounded-xl bg-muted/40 p-4 border">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${unit.toLowerCase()}`}>{unit}</span>
                      <p className="font-heading font-bold text-xl text-foreground mt-2">{metGoal}/{unitUsers.length}</p>
                      <p className="text-xs text-muted-foreground">atingiram a meta ({goalHours}h)</p>
                      <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${unitUsers.length ? (metGoal / unitUsers.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <h4 className="font-heading font-semibold text-foreground mb-3">📊 Cursos Mais Realizados</h4>
              <div className="space-y-2">
                {coursePopularity.length === 0 && <p className="text-sm text-muted-foreground">Nenhum curso cadastrado.</p>}
                {coursePopularity.slice(0, 10).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
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

        {/* Configurações de Suporte */}
        {tab === 'support' && (
          <div className="glass-card rounded-2xl p-6 border shadow-sm">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" /> Configurações de Suporte ao Colaborador
            </h3>
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>E-mail de Atendimento</Label>
                <Input value={supportForm.email} onChange={e => setSupportForm({ ...supportForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone / Ramal</Label>
                <Input value={supportForm.phone} onChange={e => setSupportForm({ ...supportForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem de Ajuda</Label>
                <Textarea value={supportForm.message} onChange={e => setSupportForm({ ...supportForm, message: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSaveSupportConfig} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Configurações
              </Button>
            </div>
          </div>
        )}

        {tab === 'branding' && <BrandingEditor />}
      </div>
    </AppLayout>
  );
}