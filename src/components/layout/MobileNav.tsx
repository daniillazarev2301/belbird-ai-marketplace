import { useState, useEffect } from "react";
import { Home, Search, Heart, ShoppingCart, User, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}

const NavItem = ({ icon, label, href, active, badge }: NavItemProps) => (
  <Link
    to={href}
    className={cn(
      "flex flex-col items-center gap-1 py-2 px-3 transition-colors relative",
      active ? "text-primary" : "text-muted-foreground"
    )}
  >
    <div className="relative">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-2 -top-2 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </Link>
);

const MobileNav = () => {
  const location = useLocation();
  const { getItemCount } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cartCount = getItemCount();
  
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: "Главная", href: "/" },
    { icon: <Search className="h-5 w-5" />, label: "Поиск", href: "/search" },
    { icon: <Heart className="h-5 w-5" />, label: "Избранное", href: isAuthenticated ? "/account/favorites" : "/auth" },
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Корзина", href: "/cart", badge: cartCount },
    { 
      icon: isAuthenticated ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />, 
      label: isAuthenticated ? "Профиль" : "Войти", 
      href: isAuthenticated ? "/account" : "/auth" 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavItem 
            key={item.href + item.label} 
            {...item} 
            active={location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))}
          />
        ))}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default MobileNav;
