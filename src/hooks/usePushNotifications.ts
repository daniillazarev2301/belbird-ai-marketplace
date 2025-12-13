import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// VAPID public key - will be loaded from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Разрешение на уведомления отклонено');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      let subscription: PushSubscription | null = null;
      
      // Try to use real VAPID subscription if key is available
      if (VAPID_PUBLIC_KEY) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        } catch (err) {
          console.warn('Could not create real subscription, using mock:', err);
        }
      }

      // Get subscription keys
      let endpoint: string;
      let p256dh: string;
      let auth: string;

      if (subscription) {
        const keys = subscription.toJSON().keys;
        endpoint = subscription.endpoint;
        p256dh = keys?.p256dh || '';
        auth = keys?.auth || '';
      } else {
        // Mock subscription for development
        endpoint = `https://push.example.com/${crypto.randomUUID()}`;
        p256dh = btoa(crypto.randomUUID());
        auth = btoa(crypto.randomUUID().slice(0, 16));
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходимо войти в аккаунт');
        return false;
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth
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
