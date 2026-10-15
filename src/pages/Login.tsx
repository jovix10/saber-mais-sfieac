import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  Envelope, 
  Lock, 
  Eye, 
  EyeSlash, 
  ArrowRight,
  Laptop,
  Tree,
  People
} from "react-bootstrap-icons";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoFieac from "@/assets/logo-fieac.png";
import casasBranca from "@/assets/casas-branca.png";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("E-mail ou senha incorretos");
    } else {
      navigate('/');
    }
    setSubmitting(false);
  };

  const pillars = [
    { name: 'Digital', icon: Laptop },
    { name: 'Ambiental', icon: Tree },
    { name: 'Inclusiva', icon: People },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full bg-white/5" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md text-white relative z-10"
        >
          <img src={logoFieac} alt="Saber+" className="h-16 w-auto mb-8" />
          <h1 className="font-heading font-extrabold text-5xl leading-tight mb-4">Saber+</h1>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            A plataforma corporativa do Sistema FIEAC. Capacitação contínua, certificações e acompanhamento de metas.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {pillars.map(c => {
              const IconComponent = c.icon;
              return (
                <div key={c.name} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center flex flex-col items-center justify-center">
                  <IconComponent className="w-7 h-7 text-white/90 mb-2" />
                  <p className="text-white/80 text-sm font-medium">{c.name}</p>
                </div>
              );
            })}
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
            <img src={logoFieac} alt="Saber+" className="h-12 w-auto mb-3" />
            <h2 className="font-heading font-extrabold text-2xl text-foreground">Saber+</h2>
          </div>

          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="font-heading font-bold text-2xl text-foreground">Bem-vindo de volta</h2>
              <p className="text-muted-foreground text-sm mt-1">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative flex items-center">
                  <Envelope className="absolute left-3.5 text-muted-foreground w-5 h-5 pointer-events-none" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Seu email institucional" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="h-12 rounded-xl pl-11" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 text-muted-foreground w-5 h-5 pointer-events-none" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-12 rounded-xl pl-11 pr-11" 
                    required 
                    minLength={6} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gap-2 font-semibold text-base" disabled={submitting}>
                {submitting ? 'Aguarde...' : 'Entrar'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              O cadastro é feito pelo administrador do sistema.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}