import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AchievementPopup } from "@/components/AchievementPopup";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { SupportButton } from "@/components/SupportButton";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground" />
              <h1 className="font-heading font-bold text-lg text-foreground hidden sm:block">Saber+</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationPanel />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
        <AchievementPopup />
        <AccessibilityButton />
        <SupportButton />
      </div>
    </SidebarProvider>
  );
}
