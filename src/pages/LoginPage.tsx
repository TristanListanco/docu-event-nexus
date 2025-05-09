
import AuthLayout from "@/components/layout/auth-layout";
import LoginForm from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate("/events");
    }
  }, [user, navigate]);
  
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
