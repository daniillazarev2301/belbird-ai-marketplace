import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Send, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  recipients_count: number;
  status: 'sent' | 'failed';
}

const AdminPushNotifications = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [audience, setAudience] = useState('all');
  const [isSending, setIsSending] = useState(false);

  // Get subscription count
  const { data: subscriptionCount } = useQuery({
    queryKey: ['push-subscription-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Mock notification history (in production, you'd store this in a table)
  const notificationHistory: NotificationHistory[] = [];

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Заполните заголовок и текст сообщения');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          title,
          body,
          url: url || '/',
          // userId would be passed if targeting specific users
        }
      });

      if (error) throw error;

      toast.success(`Уведомление отправлено ${data.sent} подписчикам`);
      setTitle('');
      setBody('');
      setUrl('');
    } catch (error: any) {
      console.error('Error sending push:', error);
      toast.error('Ошибка при отправке уведомления');
    } finally {
      setIsSending(false);
    }
  };

  const templates = [
    {
      name: 'Новая акция',
      title: '🔥 Новая акция!',
      body: 'Скидки до 50% на товары для питомцев. Только сегодня!',
      url: '/catalog?sale=true'
    },
    {
      name: 'Напоминание о корзине',
      title: '🛒 Забыли о корзине?',
      body: 'Ваши товары ждут вас. Завершите покупку!',
      url: '/cart'
    },
    {
      name: 'Новинки',
      title: '✨ Новые товары!',
      body: 'Посмотрите новинки в нашем каталоге',
      url: '/catalog?new=true'
    }
  ];

  const applyTemplate = (template: typeof templates[0]) => {
    setTitle(template.title);
    setBody(template.body);
    setUrl(template.url);
  };

  return (
    <>
      <Helmet>
        <title>Push-уведомления — Админ-панель</title>
      </Helmet>
      <AdminLayout title="Push-уведомления" description="Отправляйте уведомления подписчикам приложения">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Push-уведомления</h1>
              <p className="text-muted-foreground">
                Отправляйте уведомления подписчикам приложения
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Users className="h-4 w-4 mr-1" />
              {subscriptionCount || 0} подписчиков
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Send Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Новое уведомление
                </CardTitle>
                <CardDescription>
                  Создайте и отправьте push-уведомление всем подписчикам
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок</Label>
                  <Input
                    id="title"
                    placeholder="🔥 Горячая акция!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {title.length}/50
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Текст сообщения</Label>
                  <Textarea
                    id="body"
                    placeholder="Скидки до 50% на все товары для питомцев!"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={200}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {body.length}/200
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Ссылка (опционально)</Label>
                  <Input
                    id="url"
                    placeholder="/catalog?sale=true"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Куда перейдёт пользователь при нажатии
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Аудитория</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все подписчики</SelectItem>
                      <SelectItem value="active" disabled>
                        Активные покупатели (скоро)
                      </SelectItem>
                      <SelectItem value="inactive" disabled>
                        Неактивные пользователи (скоро)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Предпросмотр</Label>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        B
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {title || 'Заголовок уведомления'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {body || 'Текст сообщения будет здесь...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={isSending || !title.trim() || !body.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить всем ({subscriptionCount || 0})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Шаблоны</CardTitle>
                  <CardDescription>
                    Быстрые заготовки для уведомлений
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {templates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {template.title}
                        </p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Подписчиков</span>
                    <span className="font-semibold">{subscriptionCount || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Отправлено сегодня</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Открыто</span>
                    <span className="font-semibold">—</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                История отправок
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>История пуста</p>
                  <p className="text-sm">Отправьте первое уведомление</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.recipients_count} получателей
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.sent_at).toLocaleDateString('ru')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminPushNotifications;
