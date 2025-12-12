import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AdminHeader title={title} description={description} />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
