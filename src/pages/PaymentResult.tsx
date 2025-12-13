import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader2, ShoppingBag, ArrowRight, Home } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    street?: string;
    house?: string;
  } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

type PaymentStatus = "checking" | "success" | "failed" | "pending" | "error";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const paymentResult = searchParams.get("payment"); // success or failed from Alfa-Bank redirect

  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!orderId) {
        setStatus("error");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (orderError || !orderData) {
          console.error("Error fetching order:", orderError);
          setStatus("error");
          setIsLoading(false);
          return;
        }

        setOrder(orderData as OrderData);

        // Fetch order items
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (itemsData) {
          setOrderItems(itemsData as OrderItem[]);
        }

        // If payment is already confirmed in DB, show success
        if (orderData.payment_status === "paid") {
          setStatus("success");
          setIsLoading(false);
          return;
        }

        if (orderData.payment_status === "failed") {
          setStatus("failed");
          setIsLoading(false);
          return;
        }

        // Verify payment with Alfa-Bank via our edge function
        try {
          const functionUrl = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alfa-bank-payment`);
          functionUrl.searchParams.set("action", "verify");

          const response = await fetch(functionUrl.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({ orderId })
          });

          const statusResult = await response.json();

          if (statusResult.status === "paid") {
            setOrder(prev => prev ? { ...prev, payment_status: "paid", status: "confirmed" } : null);
            setStatus("success");
          } else if (statusResult.status === "rejected" || statusResult.status === "canceled" || statusResult.status === "failed") {
            setOrder(prev => prev ? { ...prev, payment_status: "failed" } : null);
            setStatus("failed");
          } else if (paymentResult === "success") {
            // Redirect says success but not yet confirmed - pending
            setStatus("pending");
          } else if (paymentResult === "failed") {
            setStatus("failed");
          } else {
            setStatus("pending");
          }
        } catch (verifyError) {
          console.error("Error verifying payment:", verifyError);
          // Fall back to URL params
          if (paymentResult === "success") {
            setStatus("pending");
          } else if (paymentResult === "failed") {
            setStatus("failed");
          } else {
            setStatus("pending");
          }
        }
      } catch (error) {
        console.error("Error checking payment:", error);
        setStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [orderId, paymentResult]);

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Оплата прошла успешно!",
          description: "Ваш заказ принят и уже обрабатывается",
          badge: <Badge className="bg-green-500">Оплачено</Badge>
        };
      case "failed":
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "Оплата не прошла",
          description: "К сожалению, платеж был отклонен. Попробуйте еще раз или выберите другой способ оплаты",
          badge: <Badge variant="destructive">Ошибка оплаты</Badge>
        };
      case "pending":
        return {
          icon: <Clock className="h-16 w-16 text-amber-500" />,
          title: "Ожидаем подтверждения",
          description: "Платеж обрабатывается. Статус обновится автоматически",
          badge: <Badge variant="secondary">Ожидание</Badge>
        };
      case "error":
        return {
          icon: <XCircle className="h-16 w-16 text-muted-foreground" />,
          title: "Заказ не найден",
          description: "Не удалось найти информацию о заказе",
          badge: null
        };
      default:
        return {
          icon: <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />,
          title: "Проверяем статус оплаты...",
          description: "Пожалуйста, подождите",
          badge: null
        };
    }
  };

  const config = getStatusConfig();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 pb-24 lg:pb-12">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Проверяем статус оплаты...</p>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 lg:pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Status Card */}
          <Card className="mb-6">
            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col items-center text-center">
                {config.icon}
                <h1 className="text-2xl font-bold mt-4 mb-2">{config.title}</h1>
                <p className="text-muted-foreground mb-4">{config.description}</p>
                {config.badge}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          {order && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Заказ #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      от {new Date(order.created_at).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>
                    {order.status === "confirmed" ? "Подтвержден" : 
                     order.status === "pending" ? "Ожидает" : order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                {orderItems.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Товары</h3>
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Total */}
                <div className="flex justify-between font-bold text-lg">
                  <span>Итого</span>
                  <span>{order.total_amount.toLocaleString()} ₽</span>
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Адрес доставки</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{order.shipping_address.name}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.street}, {order.shipping_address.house}</p>
                        <p>{order.shipping_address.phone}</p>
                        <p>{order.shipping_address.email}</p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button asChild className="flex-1">
                    <Link to="/account/orders">
                      Мои заказы
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/">
                      <Home className="h-4 w-4 mr-2" />
                      На главную
                    </Link>
                  </Button>
                </div>

                {/* Retry Payment for Failed */}
                {status === "failed" && (
                  <Button variant="default" className="w-full" asChild>
                    <Link to="/checkout">
                      Попробовать снова
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Order Found */}
          {!order && status === "error" && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-6">
                    Заказ не найден или ссылка устарела
                  </p>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link to="/account/orders">Мои заказы</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/">На главную</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default PaymentResult;
