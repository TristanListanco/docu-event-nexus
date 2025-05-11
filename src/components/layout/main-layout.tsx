
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Calendar, Users, Info } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <Sidebar>
          <SidebarHeader />
          
          {/* Navigation */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      variant={isActive("/events") ? "default" : "ghost"}
                      onClick={() => navigate("/events")}
                    >
                      <Calendar size={20} />
                      <span>Events</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      variant={isActive("/staff") ? "default" : "ghost"}
                      onClick={() => navigate("/staff")}
                    >
                      <Users size={20} />
                      <span>Staff</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      variant={isActive("/about") ? "default" : "ghost"}
                      onClick={() => navigate("/about")}
                    >
                      <Info size={20} />
                      <span>About</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Bottom items */}
          <SidebarFooter>
            <ThemeToggle />
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Trigger */}
        <SidebarTrigger />
        
        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
