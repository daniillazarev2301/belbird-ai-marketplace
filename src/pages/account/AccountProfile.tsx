import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Mail, Phone, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AccountProfile = () => {
  const [profile, setProfile] = useState<{
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setFormData({
        full_name: data?.full_name || '',
        phone: data?.phone || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Ошибка сохранения');
      } else {
        toast.success('Профиль сохранён');
        setProfile(prev => prev ? { ...prev, ...formData } : prev);
      }
    }
    setSaving(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Профиль — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-semibold">Мой профиль</h1>
            <p className="text-muted-foreground">Управляйте личными данными</p>
          </div>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Личные данные</CardTitle>
              <CardDescription>Обновите информацию профиля</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {getInitials(formData.full_name || profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">{formData.full_name || profile?.email || 'Пользователь'}</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Полное имя</Label>
                  <Input 
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Иван Иванов"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={profile?.email || ''} 
                      className="pl-10" 
                      disabled 
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10" 
                      placeholder="+7 999 123 45 67"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Пароль</p>
                  <p className="text-sm text-muted-foreground">Изменить пароль аккаунта</p>
                </div>
                <Button variant="outline">Изменить пароль</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountProfile;
