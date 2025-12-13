import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push-уведомления не поддерживаются вашим браузером');
      return false;
    }

    setIsLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Разрешение на уведомления отклонено');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // For demo purposes, we'll create a mock subscription
      // In production, you would use VAPID keys
      const mockSubscription = {
        endpoint: `https://push.example.com/${crypto.randomUUID()}`,
        p256dh: btoa(crypto.randomUUID()),
        auth: btoa(crypto.randomUUID().slice(0, 16))
      };

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходимо войти в аккаунт');
        return false;
      }

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.p256dh,
        auth: mockSubscription.auth
      }, {
        onConflict: 'endpoint'
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Уведомления включены!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Ошибка при подключении уведомлений');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSubscribed(false);
      toast.success('Уведомления отключены');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Ошибка при отключении уведомлений');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe
  };
};
