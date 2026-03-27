import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogIn, ArrowRight } from "lucide-react";
import logoFieac from "@/assets/logo-fieac.png";
import casasBranca from "@/assets/casas-branca.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/3" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md text-white relative z-10"
        >
          <img src={logoFieac} alt="FIEAC" className="h-16 w-auto mb-8" />

          <h1 className="font-heading font-extrabold text-5xl leading-tight mb-4">
            Saber+
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            A plataforma gamificada da Universidade Corporativa. Aprenda, conquiste badges e lidere o ranking!
          </p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { name: 'Digital', emoji: '💻' },
              { name: 'Ambiental', emoji: '🌱' },
              { name: 'Inclusiva', emoji: '🤝' },
            ].map(c => (
              <div key={c.name} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:bg-white/15 transition-colors">
                <span className="text-2xl block mb-1">{c.emoji}</span>
                <p className="text-white/80 text-sm font-medium">{c.name}</p>
              </div>
            ))}
          </div>

          <img src={casasBranca} alt="FIEAC · SESI · SENAI · IEL" className="w-64 opacity-50" />
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logoFieac} alt="FIEAC" className="h-12 w-auto mb-3 invert" />
            <h2 className="font-heading font-extrabold text-2xl text-foreground">Saber+</h2>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="font-heading font-bold text-2xl text-foreground">Bem-vindo de volta</h2>
              <p className="text-muted-foreground text-sm mt-1">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@fieac.org.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <button type="button" className="text-xs text-primary hover:underline">Esqueceu?</button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-semibold text-base">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Não tem conta?{' '}
              <button className="text-primary font-medium hover:underline">Cadastre-se</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
