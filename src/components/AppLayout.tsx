import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AchievementPopup } from "@/components/AchievementPopup";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { SupportButton } from "@/components/SupportButton";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
        {/* Barra lateral com suporte a gaveta drawer no mobile e fixa no desktop */}
        <AppSidebar />

        {/* Container principal: min-w-0 é fundamental para evitar que tabelas/cards quebrem a tela no mobile */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="h-16 flex items-center justify-between border-b border-border/50 bg-card/90 backdrop-blur-xl px-3 sm:px-4 md:px-6 sticky top-0 z-30 shadow-sm transition-all">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger className="text-foreground shrink-0" />
              <div className="flex items-center gap-2 truncate">
                <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-primary">
                  Saber<span className="text-foreground">+</span>
                </span>
                <span className="hidden md:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Business
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <NotificationPanel />
            </div>
          </header>

          {/* Área principal: fluida e centralizada para telas ultra-wide */}
          <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Elementos flutuantes / Modais */}
        <AchievementPopup />
        <AccessibilityButton />
        <SupportButton />
      </div>
    </SidebarProvider>
  );
}