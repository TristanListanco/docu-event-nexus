
import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-[100vh] min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}
