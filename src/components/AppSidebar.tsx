import {
  LayoutDashboard, Upload, Trophy, Award, Shield, LogOut, User, ShieldCheck, Users, Flame,
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
  { title: "Cursos em Alta", url: "/#cursos", icon: Flame },
  { title: "Certificados", url: "/certificates", icon: Upload },
  { title: "Ranking", url: "/leaderboard", icon: Trophy },
  { title: "Conquistas", url: "/badges", icon: Award },
  { title: "Compliance", url: "/compliance", icon: ShieldCheck },
  { title: "Perfil", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isGestor, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const hours = Number(profile?.total_hours) || 0;
  const ringColor = hours >= 40 ? 'border-red-500' : hours >= 20 ? 'border-amber-500' : hours >= 10 ? 'border-violet-500' : hours >= 5 ? 'border-blue-500' : 'border-muted';

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

        {isGestor && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest">Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/manager" className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <Users className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Minha Equipe</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
          <div className="px-2 pb-2 flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full border-2 ${ringColor} overflow-hidden shrink-0`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-accent-foreground">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-sidebar-foreground/60 truncate">{profile.name}</p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">{profile.email}</p>
            </div>
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
