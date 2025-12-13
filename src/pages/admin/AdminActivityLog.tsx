import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Activity, 
  Search, 
  Filter,
  User,
  Package,
  ShoppingCart,
  Settings,
  FileText,
  Trash2,
  Edit,
  Plus,
  Eye,
  LogIn,
  LogOut,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const actionIcons: Record<string, React.ElementType> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  login: LogIn,
  logout: LogOut,
  settings: Settings,
};

const actionLabels: Record<string, string> = {
  create: "Создание",
  update: "Обновление",
  delete: "Удаление",
  view: "Просмотр",
  login: "Вход",
  logout: "Выход",
  settings: "Настройки",
};

const entityLabels: Record<string, string> = {
  product: "Товар",
  category: "Категория",
  order: "Заказ",
  customer: "Клиент",
  page: "Страница",
  blog: "Блог",
  settings: "Настройки",
  promo_code: "Промокод",
  review: "Отзыв",
};

const AdminActivityLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-activity-logs", actionFilter, entityFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for user names
      const userIds = [...new Set((data || []).map(log => log.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(log => ({
        ...log,
        profile: profileMap.get(log.user_id) || null
      })) as ActivityLog[];
    },
  });

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity_type?.toLowerCase().includes(search) ||
      log.profile?.full_name?.toLowerCase().includes(search) ||
      log.profile?.email?.toLowerCase().includes(search)
    );
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create": return "default";
      case "update": return "secondary";
      case "delete": return "destructive";
      case "login": return "outline";
      case "logout": return "outline";
      default: return "secondary";
    }
  };

  return (
    <>
      <Helmet>
        <title>Журнал активности — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Журнал активности" description="Отслеживание действий администраторов">
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по действиям..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Действие" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все действия</SelectItem>
                    <SelectItem value="create">Создание</SelectItem>
                    <SelectItem value="update">Обновление</SelectItem>
                    <SelectItem value="delete">Удаление</SelectItem>
                    <SelectItem value="login">Вход</SelectItem>
                    <SelectItem value="logout">Выход</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Объект" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все объекты</SelectItem>
                    <SelectItem value="product">Товары</SelectItem>
                    <SelectItem value="order">Заказы</SelectItem>
                    <SelectItem value="category">Категории</SelectItem>
                    <SelectItem value="customer">Клиенты</SelectItem>
                    <SelectItem value="settings">Настройки</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Activity List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                История действий
              </CardTitle>
              <CardDescription>
                Последние 100 действий администраторов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Нет записей активности</p>
                  <p className="text-sm">Действия администраторов будут отображаться здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const Icon = actionIcons[log.action] || Activity;
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${
                          log.action === "delete" ? "bg-destructive/10 text-destructive" :
                          log.action === "create" ? "bg-green-100 text-green-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {log.profile?.full_name || log.profile?.email || "Неизвестный пользователь"}
                            </span>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {actionLabels[log.action] || log.action}
                            </Badge>
                            {log.entity_type && (
                              <span className="text-muted-foreground">
                                {entityLabels[log.entity_type] || log.entity_type}
                                {log.entity_id && ` #${log.entity_id.slice(0, 8)}`}
                              </span>
                            )}
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.created_at), "d MMMM yyyy, HH:mm:ss", { locale: ru })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminActivityLog;