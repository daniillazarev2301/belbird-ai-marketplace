import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  ShoppingBag,
  Heart,
  PawPrint,
  RefreshCw,
  Gift,
  Settings,
  LogOut,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: User, label: "Профиль", href: "/account" },
  { icon: ShoppingBag, label: "Заказы", href: "/account/orders", badge: 2 },
  { icon: Heart, label: "Избранное", href: "/account/favorites", badge: 12 },
  { icon: PawPrint, label: "Мои питомцы", href: "/account/pets" },
  { icon: RefreshCw, label: "Подписки", href: "/account/subscriptions" },
  { icon: Gift, label: "Бонусы", href: "/account/loyalty" },
  { icon: Settings, label: "Настройки", href: "/account/settings" },
];

const AccountSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* User Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                АМ
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">Анна Морозова</p>
              <div className="flex items-center gap-1 text-secondary">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-medium">VIP клиент</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Бонусы</span>
              <span className="font-semibold text-primary">2,450 ₽</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/account" && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/account"}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent"
              )}
              activeClassName="bg-accent text-accent-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
        
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full">
          <LogOut className="h-5 w-5" />
          <span>Выйти</span>
        </button>
      </nav>
    </aside>
  );
};

export default AccountSidebar;
