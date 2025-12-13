import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Heart, ShoppingBag, ArrowRight, Tag, Truck, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppliedPromo {
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
}

const Cart = () => {
  const { items, removeItem, updateQuantity, getTotal } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(i => i.id));
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(selectedItems.length === items.length ? [] : items.map(i => i.id));
  };

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsCheckingPromo(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Промокод не найден или недействителен");
        return;
      }

      // Check if expired
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast.error("Срок действия промокода истёк");
        return;
      }

      // Check max uses
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("Промокод исчерпан");
        return;
      }

      // Check min order amount
      const subtotal = items.filter(item => selectedItems.includes(item.id))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      if (data.min_order_amount && subtotal < data.min_order_amount) {
        toast.error(`Минимальная сумма заказа для этого промокода: ${data.min_order_amount.toLocaleString()} ₽`);
        return;
      }

      setAppliedPromo({
        code: data.code,
        discount_percent: data.discount_percent,
        discount_amount: data.discount_amount,
      });
      toast.success("Промокод применён!");
    } catch (error) {
      console.error("Error checking promo code:", error);
      toast.error("Ошибка при проверке промокода");
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const selectedCartItems = items.filter(item => selectedItems.includes(item.id));
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discount_percent) {
      discount = Math.round(subtotal * appliedPromo.discount_percent / 100);
    } else if (appliedPromo.discount_amount) {
      discount = Math.min(appliedPromo.discount_amount, subtotal);
    }
  }
  const total = subtotal - discount;

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
        <h1 className="text-2xl font-bold mb-6">Корзина</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedItems.length === items.length && items.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm font-medium">
                  Выбрано: {selectedItems.length} из {items.length}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  selectedItems.forEach(id => removeItem(id));
                  setSelectedItems([]);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить выбранные
              </Button>
            </div>

            {/* Items */}
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                      <Link to={`/product/${item.slug}`}>
                        <img 
                          src={item.image || "/placeholder.svg"} 
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg bg-muted"
                        />
                      </Link>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link to={`/product/${item.slug}`} className="hover:text-primary">
                            <h3 className="font-medium line-clamp-2">{item.name}</h3>
                          </Link>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{(item.price * item.quantity).toLocaleString()} ₽</p>
                          {item.oldPrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              {(item.oldPrice * item.quantity).toLocaleString()} ₽
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              removeItem(item.id);
                              setSelectedItems(prev => prev.filter(id => id !== item.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Ваш заказ</h2>

                {/* Promo Code */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-mono font-medium">{appliedPromo.code}</span>
                      <span className="text-sm text-muted-foreground">
                        (-{appliedPromo.discount_percent 
                          ? `${appliedPromo.discount_percent}%` 
                          : `${appliedPromo.discount_amount?.toLocaleString()} ₽`})
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removePromo}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-4">
                    <Input 
                      placeholder="Промокод"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    />
                    <Button 
                      variant="outline" 
                      onClick={applyPromo}
                      disabled={isCheckingPromo || !promoCode}
                    >
                      {isCheckingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товары ({selectedCartItems.length})</span>
                    <span>{subtotal.toLocaleString()} ₽</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Скидка</span>
                      <span>-{discount.toLocaleString()} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Доставка
                    </span>
                    <span>Рассчитается далее</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Итого</span>
                  <span>{total.toLocaleString()} ₽</span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={selectedItems.length === 0}
                  asChild
                >
                  <Link to="/checkout">
                    Оформить заказ
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Нажимая «Оформить заказ», вы соглашаетесь с условиями продажи
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

export default Cart;
