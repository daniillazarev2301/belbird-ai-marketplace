import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminNotifications } from "./AdminNotifications";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

const AdminHeader = ({ title, description }: AdminHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="lg:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>

        <div className="flex-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground hidden sm:block">{description}</p>
          )}
        </div>

        {/* Search */}
        <div className="hidden md:block relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск..."
            className="pl-10 bg-muted/50 border-0"
          />
        </div>

        {/* Notifications - Real data from database */}
        <AdminNotifications />

        {/* Back to Store */}
        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
          <a href="/">На сайт</a>
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;