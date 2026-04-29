import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

type BrandingMap = Record<string, string>;

interface BrandingContextValue {
  config: BrandingMap;
  loading: boolean;
  getLabel: (key: string, fallback: string) => string;
  getIconName: (key: string, fallback: string) => string;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

const CACHE_KEY = "branding_cache_v1";

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BrandingMap>(() => {
    try {
      const c = localStorage.getItem(CACHE_KEY);
      return c ? JSON.parse(c) : {};
    } catch { return {}; }
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    const { data } = await supabase.from("branding_config").select("key, value");
    if (data) {
      const map: BrandingMap = {};
      data.forEach((r: any) => { map[r.key] = r.value; });
      setConfig(map);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)); } catch {}
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
    const channel = supabase
      .channel("branding-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "branding_config" }, () => {
        fetchConfig();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const value: BrandingContextValue = {
    config,
    loading,
    getLabel: (key, fallback) => (config[`label.${key}`] && config[`label.${key}`].trim()) || fallback,
    getIconName: (key, fallback) => (config[`icon.${key}`] && config[`icon.${key}`].trim()) || fallback,
    refresh: fetchConfig,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
}

interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: string;
}

/** Renders any lucide-react icon by its PascalCase name. Falls back gracefully. */
export function DynamicIcon({ name, fallback = "Circle", ...props }: DynamicIconProps) {
  const Icons = Lucide as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Component = Icons[name] || Icons[fallback] || Icons.Circle;
  return <Component {...props} />;
}
