import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings,
  Users,
  Bell,
  Edit,
  Trash2,
  Plus,
  Check,
  Loader2,
  Save,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  moderator: "Модератор",
  user: "Пользователь",
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  moderator: "secondary",
  user: "outline",
};

// Define which modules each role can access
const defaultPermissions: Record<string, Record<string, boolean>> = {
  admin: {
    dashboard: true,
    products: true,
    categories: true,
    orders: true,
    customers: true,
    content: true,
    settings: true,
    analytics: true,
  },
  moderator: {
    dashboard: true,
    products: true,
    categories: true,
    orders: true,
    customers: true,
    content: true,
    settings: false,
    analytics: true,
  },
  user: {
    dashboard: true,
    products: false,
    categories: false,
    orders: true,
    customers: false,
    content: false,
    settings: false,
    analytics: false,
  },
};

const modules = [
  { key: "dashboard", label: "Дашборд" },
  { key: "products", label: "Товары" },
  { key: "categories", label: "Категории" },
  { key: "orders", label: "Заказы" },
  { key: "customers", label: "Клиенты" },
  { key: "content", label: "Контент" },
  { key: "analytics", label: "Аналитика" },
  { key: "settings", label: "Настройки" },
];

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "moderator" | "user">("moderator");
  const [permissions, setPermissions] = useState(defaultPermissions);

  // Fetch team members (users with roles)
  const { data: teamMembers = [], isLoading: loadingTeam, refetch: refetchTeam } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = roles?.map((r) => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email };
      });

      return (roles || []).map((role) => ({
        ...role,
        profile: profileMap[role.user_id] || { full_name: null, email: null },
      })) as TeamMember[];
    },
  });

  // Update user role
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      toast.success("Роль обновлена");
      setEditMemberDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Delete user role
  const deleteRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      toast.success("Пользователь удалён из команды");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Add new member (find by email and assign role)
  const addMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "moderator" | "user" }) => {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        throw new Error("Пользователь с таким email не найден. Убедитесь, что он зарегистрирован.");
      }

      // Check if role already exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .single();

      if (existing) {
        throw new Error("У этого пользователя уже есть роль");
      }

      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.id, role });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      toast.success("Пользователь добавлен в команду");
      setAddMemberDialogOpen(false);
      setNewMemberEmail("");
      setNewMemberRole("moderator");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setNewMemberRole(member.role);
    setEditMemberDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Настройки — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Настройки" description="Конфигурация платформы">
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Команда
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Settings className="h-4 w-4" />
              Права доступа
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Уведомления
            </TabsTrigger>
          </TabsList>

          {/* Team Management */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Команда</CardTitle>
                  <CardDescription>Управление пользователями и ролями</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => setAddMemberDialogOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Добавить
                </Button>
              </CardHeader>
              <CardContent>
                {loadingTeam ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Нет пользователей с назначенными ролями</p>
                    <Button className="mt-4" onClick={() => setAddMemberDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить первого
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Дата добавления</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {(member.profile?.full_name || member.profile?.email || "?")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{member.profile?.full_name || "Без имени"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{member.profile?.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariants[member.role]}>
                              {roleLabels[member.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(member.created_at).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteRole.mutate(member.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* Permissions */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Права доступа</CardTitle>
                <CardDescription>Настройка разрешений по ролям</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Модуль</TableHead>
                        <TableHead className="text-center">Администратор</TableHead>
                        <TableHead className="text-center">Модератор</TableHead>
                        <TableHead className="text-center">Пользователь</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => (
                        <TableRow key={module.key}>
                          <TableCell className="font-medium">{module.label}</TableCell>
                          {(["admin", "moderator", "user"] as const).map((role) => (
                            <TableCell key={role} className="text-center">
                              <Checkbox
                                checked={permissions[role][module.key]}
                                onCheckedChange={(checked) => {
                                  setPermissions((prev) => ({
                                    ...prev,
                                    [role]: {
                                      ...prev[role],
                                      [module.key]: !!checked,
                                    },
                                  }));
                                }}
                                disabled={role === "admin" && module.key === "settings"}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <Button onClick={() => toast.success("Права доступа сохранены")}>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить права
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email-уведомления</CardTitle>
                <CardDescription>Настройка почтовых оповещений</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Новые заказы</p>
                    <p className="text-sm text-muted-foreground">Уведомление при поступлении нового заказа</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Низкий остаток</p>
                    <p className="text-sm text-muted-foreground">Когда товар заканчивается на складе</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Возвраты</p>
                    <p className="text-sm text-muted-foreground">Запросы на возврат товаров</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Отзывы</p>
                    <p className="text-sm text-muted-foreground">Новые отзывы на товары</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push-уведомления</CardTitle>
                <CardDescription>Уведомления в браузере</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Критические оповещения</p>
                    <p className="text-sm text-muted-foreground">AI-светофор рисков, сбои системы</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Новые заказы</p>
                    <p className="text-sm text-muted-foreground">Мгновенные уведомления о заказах</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить в команду</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email пользователя *</Label>
              <Input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Пользователь должен быть зарегистрирован на сайте
              </p>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => addMember.mutate({ email: newMemberEmail, role: newMemberRole })}
              disabled={!newMemberEmail || addMember.isPending}
            >
              {addMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editMemberDialogOpen} onOpenChange={setEditMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить роль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(selectedMember?.profile?.full_name || selectedMember?.profile?.email || "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedMember?.profile?.full_name || "Без имени"}</p>
                <p className="text-sm text-muted-foreground">{selectedMember?.profile?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Новая роль</Label>
              <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMemberDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => selectedMember && updateRole.mutate({ userId: selectedMember.user_id, role: newMemberRole })}
              disabled={updateRole.isPending}
            >
              {updateRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSettings;
