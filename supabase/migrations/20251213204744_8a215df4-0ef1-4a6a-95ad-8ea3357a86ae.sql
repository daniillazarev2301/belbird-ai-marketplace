-- Create function to send push notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_text TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Map status to Russian text
  CASE NEW.status
    WHEN 'pending' THEN status_text := 'Ожидает обработки';
    WHEN 'confirmed' THEN status_text := 'Подтверждён';
    WHEN 'processing' THEN status_text := 'В обработке';
    WHEN 'shipped' THEN status_text := 'Отправлен';
    WHEN 'delivered' THEN status_text := 'Доставлен';
    WHEN 'cancelled' THEN status_text := 'Отменён';
    ELSE status_text := NEW.status;
  END CASE;

  -- Insert notification record for the order owner
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO admin_notifications (type, title, message, data)
    VALUES (
      'order_status',
      'Статус заказа изменён',
      'Ваш заказ #' || LEFT(NEW.id::text, 8) || ' теперь: ' || status_text,
      jsonb_build_object(
        'order_id', NEW.id,
        'user_id', NEW.user_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();