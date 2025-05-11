import * as React from "react";
import * as LuSidebar from "@headlessui/react";
import { cn } from "@/lib/utils";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SidebarContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => {},
});

const SidebarProvider = ({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = React.useContext(SidebarContext);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full w-[220px] flex-col border-r bg-background transition-all duration-300 ease-in-out data-[closed]:w-[60px] md:relative",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:data-[closed]:translate-x-0",
        className
      )}
      data-closed={!open ? true : undefined}
    >
      {children}
    </aside>
  );
};

const SidebarHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = React.useContext(SidebarContext);
  
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b px-3",
        open ? "justify-between" : "justify-center",
        className
      )}
      {...props}
    >
      {/* Replace text with logo */}
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/28fdac2a-08bd-48c7-82a4-242c8a1d1874.png" 
          alt="CCS DOCU Logo" 
          className={cn(
            "transition-all duration-300",
            open ? "h-10" : "h-8"
          )} 
        />
      </div>
    </div>
  );
};

const SidebarContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex-1 overflow-auto p-2", className)} {...props} />
  );
};

const SidebarFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = React.useContext(SidebarContext);
  
  return (
    <div
      className={cn(
        "flex items-center border-t p-2",
        open ? "justify-between" : "justify-center",
        className
      )}
      {...props}
    />
  );
};

const SidebarGroup = ({ className, children, title }: React.HTMLAttributes<HTMLDivElement> & { title?: string }) => {
  return (
    <div className={cn("mb-3 space-y-1", className)}>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      {children}
    </div>
  );
};

const SidebarGroupLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = React.useContext(SidebarContext);
  
  if (!open) {
    return null;
  }
  
  return (
    <div
      className={cn(
        "px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};

const SidebarGroupContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("space-y-1", className)} {...props} />;
};

const SidebarMenu = ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => {
  return <ul className={cn("", className)} {...props} />;
};

const SidebarMenuItem = ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => {
  return <li className={cn("", className)} {...props} />;
};

type SidebarMenuButtonProps = React.ComponentPropsWithoutRef<typeof Button>;

const SidebarMenuButton = ({
  className,
  children,
  variant = "ghost",
  size = "sm",
  ...props
}: SidebarMenuButtonProps) => {
  const { open } = React.useContext(SidebarContext);
  
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "w-full justify-start",
        !open && "px-2",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child);
        }
        if (typeof child === 'string' && !open) {
          return null;
        }
        return child;
      })}
    </Button>
  );
};

const SidebarTrigger = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof Button>) => {
  const { open, setOpen } = React.useContext(SidebarContext);
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("fixed left-2 top-2 z-30 md:hidden", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      <MenuIcon className="h-4 w-4" />
    </Button>
  );
};

export {
  Sidebar,
  SidebarContent,
  SidebarContext,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
};
