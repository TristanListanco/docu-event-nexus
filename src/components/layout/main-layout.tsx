
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, Users, Info, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden flex items-center border-b p-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[240px] p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 flex items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-primary">CCS DOCU</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col gap-1 p-2 flex-1">
                <Button
                  variant={isActive("/events") ? "default" : "ghost"}
                  className="flex items-center justify-start gap-2 w-full"
                  onClick={() => navigate("/events")}
                >
                  <Calendar size={20} />
                  <span>Events</span>
                </Button>
                <Button
                  variant={isActive("/staff") ? "default" : "ghost"}
                  className="flex items-center justify-start gap-2 w-full"
                  onClick={() => navigate("/staff")}
                >
                  <Users size={20} />
                  <span>Staff</span>
                </Button>
                <Button
                  variant={isActive("/about") ? "default" : "ghost"}
                  className="flex items-center justify-start gap-2 w-full"
                  onClick={() => navigate("/about")}
                >
                  <Info size={20} />
                  <span>About</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-start gap-2 w-full mt-auto"
                  onClick={handleSignOut}
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </Button>
              </div>
              
              <div className="p-4">
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex-1 flex justify-center">
          <span className="font-bold text-lg">CCS Documentation System</span>
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex sidebar bg-sidebar border-r border-sidebar-border ${collapsed ? "w-16" : "w-64"} flex-shrink-0 transition-all duration-300 flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-primary">CCS DOCU</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <span className="font-bold text-lg text-primary">CD</span>
            </div>
          )}
        </div>
        
        <Separator />

        {/* Navigation */}
        <div className="flex flex-col gap-1 p-2 flex-1">
          <Button
            variant={isActive("/events") ? "default" : "ghost"}
            className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-2 w-full`}
            onClick={() => navigate("/events")}
          >
            <Calendar size={20} />
            {!collapsed && <span>Events</span>}
          </Button>
          <Button
            variant={isActive("/staff") ? "default" : "ghost"}
            className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-2 w-full`}
            onClick={() => navigate("/staff")}
          >
            <Users size={20} />
            {!collapsed && <span>Staff</span>}
          </Button>
          <Button
            variant={isActive("/about") ? "default" : "ghost"}
            className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-2 w-full`}
            onClick={() => navigate("/about")}
          >
            <Info size={20} />
            {!collapsed && <span>About</span>}
          </Button>
          
          <div className="mt-auto"></div>
          <Button
            variant="ghost"
            className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-2 w-full mt-4`}
            onClick={handleSignOut}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>

        {/* Bottom items */}
        <div className="p-4 flex items-center justify-between">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
            size="sm"
          >
            {collapsed ? '→' : '←'}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
