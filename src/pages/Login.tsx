import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--gradient-hero)' }}>
      {/* Left branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-white"
        >
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center font-heading font-bold text-2xl text-white mb-8 border border-white/20">
            S+
          </div>
          <h1 className="font-heading font-extrabold text-4xl leading-tight mb-4">
            Saber+ FIEAC
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            A plataforma gamificada da Universidade Corporativa. Aprenda, conquiste badges e lidere o ranking!
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['Digital', 'Ambiental', 'Inclusiva'].map(c => (
              <div key={c} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/90 text-sm font-medium">{c}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="text-center mb-8">
              <div className="lg:hidden h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-lg mx-auto mb-4">
                S+
              </div>
              <h2 className="font-heading font-bold text-xl text-foreground">Bem-vindo de volta</h2>
              <p className="text-muted-foreground text-sm mt-1">Entre na sua conta</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@fieac.org.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
