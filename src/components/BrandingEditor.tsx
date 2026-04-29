import { useState, useMemo, useEffect } from "react";
import * as Lucide from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useBranding, DynamicIcon } from "@/hooks/useBranding";
import { Search, Save, RotateCcw, Palette, Check } from "lucide-react";
import { toast } from "sonner";

interface EditableItem {
  key: string;
  defaultLabel: string;
  defaultIcon?: string;
  group: string;
}

const EDITABLE_ITEMS: EditableItem[] = [
  // Plataforma
  { key: "platform.name", defaultLabel: "Saber+", group: "Identidade" },
  // Grupos do menu
  { key: "group.menu", defaultLabel: "Menu", group: "Grupos do menu" },
  { key: "group.gestao", defaultLabel: "Gestão", group: "Grupos do menu" },
  { key: "group.admin", defaultLabel: "Administração", group: "Grupos do menu" },
  // Itens do menu
  { key: "menu.dashboard", defaultLabel: "Dashboard", defaultIcon: "LayoutDashboard", group: "Menu principal" },
  { key: "menu.cursos", defaultLabel: "Cursos em Alta", defaultIcon: "Flame", group: "Menu principal" },
  { key: "menu.certificates", defaultLabel: "Certificados", defaultIcon: "Upload", group: "Menu principal" },
  { key: "menu.leaderboard", defaultLabel: "Ranking", defaultIcon: "Trophy", group: "Menu principal" },
  { key: "menu.badges", defaultLabel: "Conquistas", defaultIcon: "Award", group: "Menu principal" },
  { key: "menu.compliance", defaultLabel: "Compliance", defaultIcon: "ShieldCheck", group: "Menu principal" },
  { key: "menu.profile", defaultLabel: "Perfil", defaultIcon: "User", group: "Menu principal" },
  { key: "menu.manager", defaultLabel: "Minha Equipe", defaultIcon: "Users", group: "Menu principal" },
  { key: "menu.admin", defaultLabel: "Painel Admin", defaultIcon: "Shield", group: "Menu principal" },
];

// All Lucide icon names (PascalCase)
const ALL_ICONS = Object.keys(Lucide).filter(k => {
  const v = (Lucide as any)[k];
  return typeof v === "object" && v?.$$typeof && /^[A-Z]/.test(k) && k !== "Icon" && k !== "createLucideIcon";
});

export function BrandingEditor() {
  const { config, refresh, getLabel, getIconName } = useBranding();
  const [drafts, setDrafts] = useState<Record<string, { label?: string; icon?: string }>>({});
  const [iconPickerKey, setIconPickerKey] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDrafts({});
  }, [config]);

  const filteredIcons = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    const list = q ? ALL_ICONS.filter(n => n.toLowerCase().includes(q)) : ALL_ICONS;
    return list.slice(0, 200);
  }, [iconSearch]);

  const grouped = useMemo(() => {
    const g: Record<string, EditableItem[]> = {};
    EDITABLE_ITEMS.forEach(it => { (g[it.group] ||= []).push(it); });
    return g;
  }, []);

  const getCurrentLabel = (it: EditableItem) =>
    drafts[it.key]?.label ?? getLabel(it.key, it.defaultLabel);
  const getCurrentIcon = (it: EditableItem) =>
    drafts[it.key]?.icon ?? (it.defaultIcon ? getIconName(it.key, it.defaultIcon) : "");

  const setDraftLabel = (key: string, label: string) => {
    setDrafts(d => ({ ...d, [key]: { ...d[key], label } }));
  };
  const setDraftIcon = (key: string, icon: string) => {
    setDrafts(d => ({ ...d, [key]: { ...d[key], icon } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const rows: { key: string; value: string }[] = [];
    Object.entries(drafts).forEach(([key, d]) => {
      const item = EDITABLE_ITEMS.find(i => i.key === key);
      if (!item) return;
      if (d.label !== undefined && d.label !== getLabel(key, item.defaultLabel)) {
        rows.push({ key: `label.${key}`, value: d.label });
      }
      if (d.icon !== undefined && item.defaultIcon && d.icon !== getIconName(key, item.defaultIcon)) {
        rows.push({ key: `icon.${key}`, value: d.icon });
      }
    });
    if (rows.length === 0) { toast.info("Nada para salvar"); setSaving(false); return; }
    const { error } = await supabase.from("branding_config").upsert(rows, { onConflict: "key" });
    if (error) { toast.error("Erro ao salvar: " + error.message); }
    else { toast.success(`${rows.length} alteração(ões) aplicada(s)!`); setDrafts({}); refresh(); }
    setSaving(false);
  };

  const handleResetItem = async (key: string, item: EditableItem) => {
    const keysToDelete = [`label.${key}`];
    if (item.defaultIcon) keysToDelete.push(`icon.${key}`);
    const { error } = await supabase.from("branding_config").delete().in("key", keysToDelete);
    if (error) { toast.error("Erro ao restaurar"); return; }
    toast.success(`"${item.defaultLabel}" restaurado ao padrão`);
    setDrafts(d => { const n = { ...d }; delete n[key]; return n; });
    refresh();
  };

  const handleResetAll = async () => {
    if (!confirm("Restaurar TODAS as personalizações ao padrão? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("branding_config").delete().neq("key", "");
    if (error) { toast.error("Erro ao restaurar"); return; }
    toast.success("Todas as personalizações foram restauradas!");
    setDrafts({});
    refresh();
  };

  const dirtyCount = Object.keys(drafts).length;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Personalização da Plataforma
            </h3>
            <p className="text-sm text-muted-foreground">Edite nomes e ícones do menu, identidade visual e mais.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetAll} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Restaurar tudo
            </Button>
            <Button onClick={handleSave} disabled={saving || dirtyCount === 0} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : `Salvar${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
            </Button>
          </div>
        </div>

        {Object.entries(grouped).map(([groupName, items]) => (
          <div key={groupName} className="mb-6 last:mb-0">
            <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{groupName}</h4>
            <div className="space-y-3">
              {items.map(it => {
                const currentLabel = getCurrentLabel(it);
                const currentIcon = getCurrentIcon(it);
                const isDirty = !!drafts[it.key];
                return (
                  <div key={it.key} className={`flex items-center gap-3 p-3 rounded-xl border ${isDirty ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}>
                    {it.defaultIcon && (
                      <button
                        onClick={() => { setIconPickerKey(it.key); setIconSearch(""); }}
                        className="h-12 w-12 rounded-lg bg-background border-2 border-border hover:border-primary flex items-center justify-center shrink-0 transition-colors"
                        title="Trocar ícone"
                      >
                        <DynamicIcon name={currentIcon} className="h-5 w-5 text-foreground" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">{it.key}</Label>
                      <Input
                        value={currentLabel}
                        onChange={e => setDraftLabel(it.key, e.target.value)}
                        placeholder={it.defaultLabel}
                        className="mt-1 h-9"
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleResetItem(it.key, it)} title="Restaurar padrão">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Icon picker */}
      <Dialog open={!!iconPickerKey} onOpenChange={(o) => !o && setIconPickerKey(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escolher ícone</DialogTitle>
            <DialogDescription>Pesquise entre todos os ícones disponíveis (Lucide).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={iconSearch}
                onChange={e => setIconSearch(e.target.value)}
                placeholder="Ex: home, user, star..."
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredIcons.length === 200 ? "Mostrando primeiros 200 — refine a busca." : `${filteredIcons.length} resultado(s)`}
            </p>
            <div className="grid grid-cols-8 gap-2 max-h-[400px] overflow-y-auto p-1">
              {filteredIcons.map(name => {
                const item = EDITABLE_ITEMS.find(i => i.key === iconPickerKey);
                const isSelected = item && getCurrentIcon(item) === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      if (iconPickerKey) setDraftIcon(iconPickerKey, name);
                      setIconPickerKey(null);
                    }}
                    className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors p-1 ${isSelected ? "border-primary bg-primary/10" : "border-border"}`}
                    title={name}
                  >
                    <DynamicIcon name={name} className="h-5 w-5" />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{name}</span>
                    {isSelected && <Check className="absolute h-3 w-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
