
import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}
