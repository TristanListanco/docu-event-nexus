
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Info, LogOut } from "lucide-react";
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
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center space-x-2 px-2">
              <span className="font-bold text-lg text-primary">CCS DOCU</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon size={20} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="p-2">
              <ThemeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
          {/* Mobile header with sidebar trigger */}
          <div className="md:hidden flex items-center border-b p-4">
            <SidebarTrigger />
            <div className="flex-1 flex justify-center">
              <span className="font-bold text-lg">CCS Documentation System</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
