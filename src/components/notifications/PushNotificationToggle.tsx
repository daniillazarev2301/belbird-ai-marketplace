import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationToggleProps {
  variant?: 'button' | 'switch';
}

export const PushNotificationToggle = ({ variant = 'switch' }: PushNotificationToggleProps) => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isSubscribed ? (
          <>
            <BellOff className="h-4 w-4 mr-2" />
            Отключить уведомления
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Включить уведомления
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="push-notifications">Push-уведомления</Label>
      </div>
      <Switch
        id="push-notifications"
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );
};
