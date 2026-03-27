import { AppLayout } from "@/components/AppLayout";
import { mockCertificates, type Competence } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, Clock, XCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const statusConfig = {
  approved: { label: 'Aprovado', icon: CheckCircle, class: 'text-emerald-600 bg-emerald-500/10' },
  pending: { label: 'Pendente', icon: Clock, class: 'text-amber-600 bg-amber-500/10' },
  rejected: { label: 'Rejeitado', icon: XCircle, class: 'text-red-600 bg-red-500/10' },
};

export default function Certificates() {
  const [showForm, setShowForm] = useState(false);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Meus Certificados</h2>
            <p className="text-muted-foreground text-sm">Envie seus certificados para validação</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Certificado
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <h3 className="font-heading font-semibold text-foreground">Enviar Certificado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Curso</Label>
                <Input placeholder="Ex: Fundamentos de IA" />
              </div>
              <div className="space-y-2">
                <Label>Carga Horária</Label>
                <Input type="number" placeholder="Ex: 8" />
              </div>
              <div className="space-y-2">
                <Label>Competência</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Digital">Digital</SelectItem>
                    <SelectItem value="Ambiental">Ambiental</SelectItem>
                    <SelectItem value="Inclusiva">Inclusiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arquivo</Label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Clique para enviar PDF/imagem</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button>Enviar para Validação</Button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {mockCertificates.map((cert, i) => {
            const status = statusConfig[cert.status];
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-sm text-foreground">{cert.title}</h4>
                    <p className="text-xs text-muted-foreground">{cert.hours}h · {cert.competence} · {cert.createdAt}</p>
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
