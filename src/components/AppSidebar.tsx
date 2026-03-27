import {
  LayoutDashboard, Upload, Trophy, Award, Shield, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import logoFieac from "@/assets/logo-fieac.png";
import casasBranca from "@/assets/casas-branca.png";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Certificados", url: "/certificates", icon: Upload },
  { title: "Ranking", url: "/leaderboard", icon: Trophy },
  { title: "Conquistas", url: "/badges", icon: Award },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3">
          <img src={logoFieac} alt="Saber+" className="h-9 w-auto shrink-0" />
          {!collapsed && (
            <p className="font-heading font-bold text-sidebar-foreground text-base tracking-tight">Saber+</p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest">Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Painel Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!collapsed && (
          <div className="mt-auto px-4 pb-2">
            <img src={casasBranca} alt="FIEAC · SESI · SENAI · IEL" className="w-full opacity-60" />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-4">
        {!collapsed && profile && (
          <div className="px-2 pb-2">
            <p className="text-xs text-sidebar-foreground/60 truncate">{profile.name}</p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate">{profile.email}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
