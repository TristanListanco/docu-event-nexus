
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute: user:', user?.email, 'loading:', loading);
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background animate-fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
          <p className="text-xs text-muted-foreground">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering content');
  return <Outlet />;
}
