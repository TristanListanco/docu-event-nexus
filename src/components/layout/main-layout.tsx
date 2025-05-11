
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Calendar, LogOut, Users, Info } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <Sidebar>
          <SidebarHeader />
          
          {/* Navigation */}
          <SidebarContent className="flex-grow overflow-y-auto">
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
          <SidebarFooter className="flex flex-col gap-2 p-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="w-full justify-start"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Trigger */}
        <SidebarTrigger />
        
        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
