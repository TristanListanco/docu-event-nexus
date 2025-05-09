
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`sidebar bg-sidebar border-r border-sidebar-border ${collapsed ? "w-16" : "w-64"} flex-shrink-0 transition-all duration-300 flex flex-col`}>
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
