import { Home, Search, Heart, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}

const NavItem = ({ icon, label, href, active, badge }: NavItemProps) => (
  <a
    href={href}
    className={cn(
      "flex flex-col items-center gap-1 py-2 px-3 transition-colors relative",
      active ? "text-primary" : "text-muted-foreground"
    )}
  >
    <div className="relative">
      {icon}
      {badge && badge > 0 && (
        <Badge className="absolute -right-2 -top-2 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-secondary text-secondary-foreground">
          {badge}
        </Badge>
      )}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </a>
);

const MobileNav = () => {
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: "Главная", href: "/", active: true },
    { icon: <Search className="h-5 w-5" />, label: "Поиск", href: "/search" },
    { icon: <Heart className="h-5 w-5" />, label: "Избранное", href: "/favorites" },
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Корзина", href: "/cart", badge: 3 },
    { icon: <User className="h-5 w-5" />, label: "Профиль", href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default MobileNav;
