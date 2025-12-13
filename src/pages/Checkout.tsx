import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Truck, CreditCard, Wallet, Building2, Clock, Shield, Check, ChevronDown, ShoppingBag, Loader2, MapPin, Gift, Minus, Plus, Tag } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import DeliveryCalculator from "@/components/checkout/DeliveryCalculator";
import PickupPointMap from "@/components/checkout/PickupPointMap";
import SavedAddresses from "@/components/checkout/SavedAddresses";

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  provider: string;
  workTime?: string;
  phone?: string;
}

interface SavedAddress {
  id: string;
  name: string;
  city: string;
  street: string | null;
  house: string | null;
  apartment: string | null;
  postal_code: string | null;
  phone: string | null;
  is_default: boolean;
  provider: string | null;
  pickup_point_id: string | null;
  pickup_point_name: string | null;
  pickup_point_address: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "card",
    name: "Банковская карта",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Visa, Mastercard, МИР"
  },
  {
    id: "sbp",
    name: "СБП",
    icon: <Building2 className="h-5 w-5" />,
    description: "Система быстрых платежей"
  },
  {
    id: "wallet",
    name: "ЮMoney",
    icon: <Wallet className="h-5 w-5" />,
    description: "Оплата электронным кошельком"
  },
  {
    id: "cash",
    name: "При получении",
    icon: <Truck className="h-5 w-5" />,
    description: "Наличными или картой курьеру"
  }
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { items: cartItems, getTotal: getCartTotal, clearCart } = useCart();
  const { settings } = useSiteSettings();

  // Check for direct buy product from navigation state
  const directBuyProduct = location.state?.directBuy;
  
  // Use direct buy product or cart items
  const items = useMemo(() => {
    if (directBuyProduct) {
      return [directBuyProduct];
    }
    return cartItems;
  }, [directBuyProduct, cartItems]);

  const getTotal = () => {
    if (directBuyProduct) {
      return directBuyProduct.price * directBuyProduct.quantity;
    }
    return getCartTotal();
  };
  const [step, setStep] = useState(1);
  const [deliveryProvider, setDeliveryProvider] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [payment, setPayment] = useState("card");
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_percent?: number; discount_amount?: number } | null>(null);
  const alfaBankEnabled = settings?.payment?.alfa_bank_enabled ?? false;

  // Check if user is authenticated and load loyalty points
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("loyalty_points")
          .eq("id", user.id)
          .single();
        
        if (profile?.loyalty_points) {
          setUserPoints(profile.loyalty_points);
        }
      }
    };
    checkAuth();
  }, []);

  const handleSelectSavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setAddressData({
      city: address.city,
      street: address.street || "",
      house: address.house || "",
      apartment: address.apartment || "",
      comment: "",
    });
    if (address.phone) {
      setContactData(prev => ({ ...prev, phone: address.phone || prev.phone }));
    }
  };

  const [contactData, setContactData] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const [addressData, setAddressData] = useState({
    city: "",
    street: "",
    house: "",
    apartment: "",
    comment: ""
  });

  const subtotal = getTotal();
  const maxPointsToUse = Math.min(userPoints, Math.floor(subtotal * 0.5)); // Max 50% of order
  const pointsDiscount = usePoints ? pointsToUse : 0;
  const total = subtotal + deliveryPrice - pointsDiscount - promoDiscount;

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    setPromoError("");
    
    try {
      const { data: promo, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !promo) {
        setPromoError("Промокод не найден или недействителен");
        setPromoDiscount(0);
        setAppliedPromo(null);
        return;
      }

      // Check validity dates
      if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
        setPromoError("Промокод ещё не активен");
        return;
      }
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        setPromoError("Срок действия промокода истёк");
        return;
      }

      // Check min order amount
      if (promo.min_order_amount && subtotal < promo.min_order_amount) {
        setPromoError(`Минимальная сумма заказа: ${promo.min_order_amount.toLocaleString()} ₽`);
        return;
      }

      // Check usage limit
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        setPromoError("Промокод исчерпан");
        return;
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_percent) {
        discount = Math.floor(subtotal * promo.discount_percent / 100);
      } else if (promo.discount_amount) {
        discount = promo.discount_amount;
      }

      setPromoDiscount(discount);
      setAppliedPromo({
        code: promo.code,
        discount_percent: promo.discount_percent,
        discount_amount: promo.discount_amount,
      });
      toast({ title: "Промокод применён!", description: `Скидка: ${discount.toLocaleString()} ₽` });
    } catch (err) {
      setPromoError("Ошибка проверки промокода");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setPromoDiscount(0);
    setAppliedPromo(null);
    setPromoError("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          total_amount: total,
          status: "pending",
          payment_method: payment,
          payment_status: "pending",
          shipping_address: {
            name: contactData.name,
            phone: contactData.phone,
            email: contactData.email,
            city: addressData.city,
            street: addressData.street,
            house: addressData.house,
            apartment: addressData.apartment,
            comment: addressData.comment,
            delivery_provider: deliveryProvider,
            pickup_point: selectedPickupPoint ? {
              id: selectedPickupPoint.id,
              name: selectedPickupPoint.name,
              address: selectedPickupPoint.address,
            } : null
          },
          notes: addressData.comment
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      // Handle loyalty points: spend and earn
      if (user) {
        // First, spend points if selected
        if (usePoints && pointsToUse > 0) {
          await supabase.from("loyalty_transactions").insert({
            user_id: user.id,
            order_id: order.id,
            points: -pointsToUse,
            type: "spend",
            description: `Списание за заказ #${order.id.slice(0, 8).toUpperCase()}`
          });
        }

        // Award loyalty points (3% of order total after discount, 1 point = 1 ruble)
        const pointsToAward = Math.floor(total * 0.03);
        if (pointsToAward > 0) {
          await supabase.from("loyalty_transactions").insert({
            user_id: user.id,
            order_id: order.id,
            points: pointsToAward,
            type: "earn",
            description: `Начисление за заказ #${order.id.slice(0, 8).toUpperCase()}`
          });
        }

        // Update profile points (subtract spent, add earned)
        const netPoints = pointsToAward - (usePoints ? pointsToUse : 0);
        await supabase
          .from("profiles")
          .update({ loyalty_points: userPoints + netPoints })
          .eq("id", user.id);
      }
      
      // If payment method is card and Alfa-Bank is enabled, process payment
      if (payment === "card" && alfaBankEnabled) {
        setIsProcessingPayment(true);
        
        try {
          const returnUrl = `${window.location.origin}/payment-result?payment=success&order=${order.id}`;
          const failUrl = `${window.location.origin}/payment-result?payment=failed&order=${order.id}`;
          
          // Add action query parameter
          const functionUrl = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alfa-bank-payment`);
          functionUrl.searchParams.set("action", "create");

          const response = await fetch(functionUrl.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
              orderId: order.id,
              amount: total,
              returnUrl,
              failUrl,
              description: `Заказ #${order.id.slice(0, 8).toUpperCase()}`
            })
          });

          const result = await response.json();

          if (!response.ok || result.error) {
            throw new Error(result.error || "Failed to create payment");
          }

          // Redirect to Alfa-Bank payment page
          if (result.formUrl) {
            window.location.href = result.formUrl;
            return;
          }
        } catch (paymentError) {
          console.error("Payment processing error:", paymentError);
          toast({
            title: "Ошибка оплаты",
            description: "Не удалось создать платеж. Заказ сохранен, вы можете оплатить его позже.",
            variant: "destructive"
          });
        } finally {
          setIsProcessingPayment(false);
        }
      }
      
      // Only clear cart if not a direct buy
      if (!directBuyProduct) {
        clearCart();
      }

      // Show loyalty points earned
      const pointsEarned = user ? Math.floor(total * 0.03) : 0;
      
      toast({
        title: "Заказ оформлен!",
        description: `Номер заказа: #${order.id.slice(0, 8).toUpperCase()}.${pointsEarned > 0 ? ` Начислено ${pointsEarned} бонусов!` : ""}`,
      });
      
      navigate("/account/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ. Попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isContactValid = contactData.name && contactData.phone && contactData.email;
  const isAddressValid = addressData.city && (selectedPickupPoint || (addressData.street && addressData.house));

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 pb-24 lg:pb-12">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/30 mb-6" />
            <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
            <p className="text-muted-foreground mb-6">
              Добавьте товары, чтобы оформить заказ
            </p>
            <Button asChild>
              <Link to="/catalog">Перейти к покупкам</Link>
            </Button>
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
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться в корзину
          </Link>
        </Button>

        <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Contact */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                  </div>
                  Контактные данные
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя и фамилия *</Label>
                    <Input 
                      id="name" 
                      placeholder="Иван Иванов"
                      value={contactData.name}
                      onChange={(e) => setContactData({...contactData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input 
                      id="phone" 
                      placeholder="+7 (999) 123-45-67"
                      value={contactData.phone}
                      onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="ivan@example.com"
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                  />
                </div>
                {step === 1 && (
                  <Button 
                    className="w-full sm:w-auto"
                    onClick={() => setStep(2)}
                    disabled={!isContactValid}
                  >
                    Продолжить
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Delivery */}
            <Card className={step < 2 ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > 2 ? <Check className="h-4 w-4" /> : "2"}
                  </div>
                  Способ доставки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Saved Addresses - only for authenticated users */}
                {isAuthenticated && (
                  <>
                    <SavedAddresses
                      onSelect={handleSelectSavedAddress}
                      selectedAddressId={selectedAddressId}
                    />
                    <Separator />
                  </>
                )}

                {/* Delivery Calculator with API Integration */}
                <DeliveryCalculator
                  city={addressData.city}
                  onCityChange={(city) => {
                    setAddressData({ ...addressData, city });
                    setSelectedAddressId(undefined); // Clear saved address selection when city changes
                  }}
                  selectedProvider={deliveryProvider}
                  onProviderChange={setDeliveryProvider}
                  onPriceChange={setDeliveryPrice}
                  cartTotal={subtotal}
                />

                {/* Pickup Point Selection */}
                {deliveryProvider && ["cdek", "boxberry", "russian_post"].includes(deliveryProvider) && addressData.city && (
                  <>
                    <Separator />
                    <PickupPointMap
                      provider={deliveryProvider}
                      city={addressData.city}
                      onSelect={setSelectedPickupPoint}
                      selectedPoint={selectedPickupPoint}
                    />
                  </>
                )}

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Адрес доставки (для курьера)</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="street">Улица *</Label>
                      <Input 
                        id="street" 
                        placeholder="ул. Пушкина"
                        value={addressData.street}
                        onChange={(e) => setAddressData({...addressData, street: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="house">Дом *</Label>
                      <Input 
                        id="house" 
                        placeholder="10"
                        value={addressData.house}
                        onChange={(e) => setAddressData({...addressData, house: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apartment">Квартира</Label>
                      <Input 
                        id="apartment" 
                        placeholder="25"
                        value={addressData.apartment}
                        onChange={(e) => setAddressData({...addressData, apartment: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Комментарий к заказу</Label>
                    <Textarea 
                      id="comment" 
                      placeholder="Код домофона, этаж, пожелания курьеру..."
                      value={addressData.comment}
                      onChange={(e) => setAddressData({...addressData, comment: e.target.value})}
                    />
                  </div>
                </div>

                {step === 2 && (
                  <Button 
                    className="w-full sm:w-auto"
                    onClick={() => setStep(3)}
                    disabled={!isAddressValid}
                  >
                    Продолжить
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Payment */}
            <Card className={step < 3 ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    3
                  </div>
                  Способ оплаты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={payment} onValueChange={setPayment}>
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${payment === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onClick={() => setPayment(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          {method.icon}
                        </div>
                        <div>
                          <span className="font-medium">{method.name}</span>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Безопасная оплата через защищённое соединение</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <Collapsible open={isOrderOpen} onOpenChange={setIsOrderOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full mb-4">
                    <h2 className="text-lg font-semibold">Ваш заказ</h2>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isOrderOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <img 
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{item.name}</p>
                            <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium">{(item.price * item.quantity).toLocaleString()} ₽</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товары ({items.length})</span>
                    <span>{subtotal.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка</span>
                    <span>{deliveryPrice === 0 ? "Бесплатно" : `${deliveryPrice.toLocaleString()} ₽`}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Промокод ({appliedPromo?.code})</span>
                      <span>-{promoDiscount.toLocaleString()} ₽</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Скидка бонусами</span>
                      <span>-{pointsDiscount.toLocaleString()} ₽</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Section */}
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Промокод</span>
                  </div>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">{appliedPromo.code}</span>
                        <span className="text-xs text-green-600">
                          {appliedPromo.discount_percent ? `-${appliedPromo.discount_percent}%` : `-${appliedPromo.discount_amount?.toLocaleString()} ₽`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={removePromoCode}>
                        Удалить
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Введите промокод"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="h-9"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9"
                          onClick={applyPromoCode}
                          disabled={!promoCode.trim() || isApplyingPromo}
                        >
                          {isApplyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Применить"}
                        </Button>
                      </div>
                      {promoError && (
                        <p className="text-xs text-destructive">{promoError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Loyalty Points Section */}
                {isAuthenticated && userPoints > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Использовать бонусы</span>
                        </div>
                        <Switch
                          checked={usePoints}
                          onCheckedChange={(checked) => {
                            setUsePoints(checked);
                            if (checked) {
                              setPointsToUse(maxPointsToUse);
                            } else {
                              setPointsToUse(0);
                            }
                          }}
                        />
                      </div>
                      {usePoints && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPointsToUse(Math.max(0, pointsToUse - 100))}
                              disabled={pointsToUse <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={pointsToUse}
                              onChange={(e) => {
                                const value = Math.min(maxPointsToUse, Math.max(0, parseInt(e.target.value) || 0));
                                setPointsToUse(value);
                              }}
                              className="h-8 w-24 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPointsToUse(Math.min(maxPointsToUse, pointsToUse + 100))}
                              disabled={pointsToUse >= maxPointsToUse}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Доступно: {userPoints.toLocaleString()} бонусов (макс. 50% от заказа)
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Итого</span>
                  <span>{total.toLocaleString()} ₽</span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={step < 3 || isSubmitting || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Переход к оплате...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Оформление...
                    </>
                  ) : payment === "card" && alfaBankEnabled ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Оплатить картой {total.toLocaleString()} ₽
                    </>
                  ) : (
                    `Оформить заказ ${total.toLocaleString()} ₽`
                  )}
                </Button>

                {payment === "card" && alfaBankEnabled && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Безопасная оплата через Альфа-Банк</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Нажимая кнопку, вы соглашаетесь с офертой и политикой конфиденциальности
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Checkout;
