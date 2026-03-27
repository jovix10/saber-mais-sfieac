import { AppLayout } from "@/components/AppLayout";
import { mockLeaderboard, mockCertificates, unitGoals } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Users, TrendingUp, FileText, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Admin() {
  const stats = [
    { label: 'Total Colaboradores', value: mockLeaderboard.length, icon: Users, color: 'text-blue-500' },
    { label: 'Certificados Pendentes', value: mockCertificates.filter(c => c.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
    { label: 'Certificados Aprovados', value: mockCertificates.filter(c => c.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Média de Horas', value: Math.round(mockLeaderboard.reduce((a, b) => a + b.totalHours, 0) / mockLeaderboard.length) + 'h', icon: TrendingUp, color: 'text-violet-500' },
  ];

  const pendingCerts = mockCertificates.filter(c => c.status === 'pending');

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Painel Administrativo</h2>
          <p className="text-muted-foreground text-sm">Gerencie colaboradores e certificados</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-4"
            >
              <s.icon className={`h-5 w-5 mb-2 ${s.color}`} />
              <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Pending Certificates */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificados Pendentes
          </h3>
          {pendingCerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum certificado pendente</p>
          ) : (
            <div className="space-y-3">
              {pendingCerts.map(cert => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{cert.title}</p>
                    <p className="text-xs text-muted-foreground">{cert.hours}h · {cert.competence}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50 gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Reprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores
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
                {mockLeaderboard.map(user => {
                  const goal = unitGoals[user.unit];
                  const pct = Math.min((user.totalHours / goal) * 100, 100);
                  return (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{user.name}</td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${user.unit.toLowerCase()}`}>
                          {user.unit}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.area}</td>
                      <td className="py-3 text-right font-heading font-semibold text-foreground">{user.totalHours}h</td>
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
      </div>
    </AppLayout>
  );
}
