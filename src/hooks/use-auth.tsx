
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthProvider: Starting auth initialization');
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('AuthProvider: Loading timeout reached, setting loading to false');
      if (mounted) {
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout);
      
      // Handle session changes synchronously to avoid re-renders
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Get initial session with error handling and timeout
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session');
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Session fetch timeout'));
          }, 8000);
        });

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("AuthProvider: Error getting session:", error.message);
        } else {
          console.log('AuthProvider: Initial session retrieved:', session?.user?.email || 'No session');
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error("AuthProvider: Error in getInitialSession:", error.message);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('AuthProvider: Cleaning up');
      mounted = false;
      clearTimeout(loadingTimeout);
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        throw error;
      }
      
      // Don't navigate immediately, let the auth state change handle it
      setTimeout(() => {
        navigate("/events");
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
      }, 100);
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      toast({
        title: "Error signing in",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: redirectUrl
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Account created",
        description: "Check your email to verify your account.",
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      toast({
        title: "Error signing up",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      navigate("/login");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      toast({
        title: "Error signing out",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
