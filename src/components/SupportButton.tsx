import { useState } from "react";
import { HelpCircle, Mail, Phone, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUPPORT_INFO = {
  email: "suporte@fieac.org.br",
  phone: "(68) 3212-4200",
  message: "Precisa de ajuda? Entre em contato com o suporte do Sistema FIEAC.",
};

export function SupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors"
        aria-label="Suporte"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-14 right-0 bg-card border rounded-xl shadow-xl p-5 space-y-3 min-w-[260px]"
          >
            <p className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" /> Suporte
            </p>
            <p className="text-xs text-muted-foreground">{SUPPORT_INFO.message}</p>
            <a href={`mailto:${SUPPORT_INFO.email}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors p-2 rounded-lg bg-muted/50">
              <Mail className="h-4 w-4 text-primary" />
              {SUPPORT_INFO.email}
            </a>
            <a href={`tel:${SUPPORT_INFO.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors p-2 rounded-lg bg-muted/50">
              <Phone className="h-4 w-4 text-primary" />
              {SUPPORT_INFO.phone}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
