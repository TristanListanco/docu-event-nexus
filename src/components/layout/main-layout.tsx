
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Info, LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    {
      title: "Events",
      icon: Calendar,
      path: "/events",
      isActive: isActive("/events"),
    },
    {
      title: "Staff",
      icon: Users,
      path: "/staff",
      isActive: isActive("/staff"),
    },
    {
      title: "About",
      icon: Info,
      path: "/about",
      isActive: isActive("/about"),
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full animate-fade-in">
        <Sidebar className="border-r border-sidebar-border animate-slide-in-right">
          <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center space-x-3 px-4 py-3 animate-scale-in">
              <img 
                src="/lovable-uploads/28fdac2a-08bd-48c7-82a4-242c8a1d1874.png" 
                alt="CCS DOCU Logo" 
                className="h-10 w-10 rounded-lg object-cover shadow-sm transition-transform duration-200 hover:scale-110"
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-primary transition-colors duration-200">CCS DOCU</span>
                <span className="text-xs text-muted-foreground transition-colors duration-200">MSU-IIT</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-2 py-4 animate-fade-in-up">
            <div className="space-y-2">
              <div className="px-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider transition-colors duration-200">
                  Navigation
                </p>
              </div>
              <SidebarMenu>
                {menuItems.map((item, index) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      onClick={() => navigate(item.path)}
                      className="h-11 px-3 mx-1 rounded-lg transition-all duration-200 hover:shadow-sm hover-scale animate-fade-in-up stagger-animation"
                      style={{ '--stagger': index } as React.CSSProperties}
                    >
                      <item.icon size={20} className="shrink-0 transition-transform duration-200 hover:scale-110" />
                      <span className="font-medium transition-colors duration-200">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border bg-gradient-to-r from-muted/30 to-muted/10 p-3 animate-fade-in-up">
            <div className="space-y-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleSignOut}
                    className="h-11 px-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover-scale"
                  >
                    <LogOut size={20} className="transition-transform duration-200 hover:scale-110" />
                    <span className="font-medium">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <div className="flex justify-center">
                <div className="animate-bounce-gentle">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
          {/* Mobile header with only sidebar trigger */}
          <div className="md:hidden flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 sticky top-0 z-40 animate-slide-in-right">
            <SidebarTrigger className="h-8 w-8 transition-transform duration-200 hover:scale-110" />
          </div>
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
