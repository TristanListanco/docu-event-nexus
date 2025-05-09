
import AuthLayout from "@/components/layout/auth-layout";
import RegisterForm from "@/components/auth/register-form";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate("/events");
    }
  }, [user, navigate]);
  
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
