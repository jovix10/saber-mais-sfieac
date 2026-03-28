import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, Clock, XCircle, Plus, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: React.ElementType; class: string }> = {
  approved: { label: 'Aprovado', icon: CheckCircle, class: 'text-emerald-600 bg-emerald-500/10' },
  pending: { label: 'Pendente', icon: Clock, class: 'text-amber-600 bg-amber-500/10' },
  rejected: { label: 'Rejeitado', icon: XCircle, class: 'text-red-600 bg-red-500/10' },
};

interface Cert {
  id: string;
  title: string;
  hours: number;
  competence: string;
  status: string;
  created_at: string;
  file_url: string | null;
}

export default function Certificates() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [competence, setCompetence] = useState('Digital');
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchCerts = async () => {
    if (!user) return;
    const { data } = await supabase.from("certificates").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setCerts(data as Cert[]);
  };

  useEffect(() => { fetchCerts(); }, [user]);

  const handleSubmit = async () => {
    if (!user || !title || !hours || !file) {
      toast.error("Preencha todos os campos e anexe o PDF");
      return;
    }
    setSubmitting(true);

    // Upload PDF
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("certificates").upload(filePath, file);
    
    if (uploadError) {
      toast.error("Erro ao enviar arquivo");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("certificates").insert({
      user_id: user.id,
      title,
      hours: parseInt(hours),
      competence,
      file_url: filePath,
    });
    if (error) {
      toast.error("Erro ao enviar certificado");
    } else {
      toast.success("Certificado enviado para validação!");
      setTitle(''); setHours(''); setCompetence('Digital'); setShowForm(false); setFile(null);
      fetchCerts();
    }
    setSubmitting(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Meus Certificados</h2>
            <p className="text-muted-foreground text-sm">Envie seus certificados em PDF para validação</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Certificado
          </Button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Enviar Certificado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Curso</Label>
                <Input placeholder="Ex: Fundamentos de IA" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Carga Horária</Label>
                <Input type="number" placeholder="Ex: 8" value={hours} onChange={e => setHours(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Competência</Label>
                <Select value={competence} onValueChange={setCompetence}>
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
                <Label>Certificado (PDF)</Label>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-medium"
                  />
                </div>
                {file && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {file.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar para Validação'}</Button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {certs.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum certificado enviado ainda</p>
          )}
          {certs.map((cert, i) => {
            const status = statusConfig[cert.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-sm text-foreground">{cert.title}</h4>
                    <p className="text-xs text-muted-foreground">{cert.hours}h · {cert.competence} · {new Date(cert.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.class}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
