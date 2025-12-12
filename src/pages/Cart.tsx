import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Heart, ShoppingBag, ArrowRight, Tag, Truck } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  image: string;
  inStock: boolean;
  weight: string;
}

const mockCartItems: CartItem[] = [
  {
    id: "1",
    name: "Корм для собак премиум класса с ягненком",
    brand: "Royal Canin",
    price: 4590,
    oldPrice: 5200,
    quantity: 2,
    image: "/placeholder.svg",
    inStock: true,
    weight: "12 кг"
  },
  {
    id: "2",
    name: "Лежанка ортопедическая для средних пород",
    brand: "Trixie",
    price: 3200,
    quantity: 1,
    image: "/placeholder.svg",
    inStock: true,
    weight: "60x45 см"
  },
  {
    id: "3",
    name: "Витамины для суставов и связок",
    brand: "8in1",
    price: 890,
    quantity: 3,
    image: "/placeholder.svg",
    inStock: false,
    weight: "60 таблеток"
  }
];

const Cart = () => {
  const [items, setItems] = useState<CartItem[]>(mockCartItems);
  const [selectedItems, setSelectedItems] = useState<string[]>(items.filter(i => i.inStock).map(i => i.id));
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    const availableIds = items.filter(i => i.inStock).map(i => i.id);
    setSelectedItems(selectedItems.length === availableIds.length ? [] : availableIds);
  };

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "belbird10") {
      setPromoApplied(true);
    }
  };

  const selectedCartItems = items.filter(item => selectedItems.includes(item.id));
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
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
              <Link to="/">Перейти к покупкам</Link>
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
                  checked={selectedItems.length === items.filter(i => i.inStock).length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm font-medium">
                  Выбрано: {selectedItems.length} из {items.filter(i => i.inStock).length}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setItems(items.filter(item => !selectedItems.includes(item.id)));
                  setSelectedItems([]);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить выбранные
              </Button>
            </div>

            {/* Items */}
            {items.map((item) => (
              <Card key={item.id} className={!item.inStock ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        disabled={!item.inStock}
                      />
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg bg-muted"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{item.brand}</p>
                          <h3 className="font-medium line-clamp-2">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{item.weight}</p>
                          {!item.inStock && (
                            <Badge variant="outline" className="mt-2 text-destructive border-destructive">
                              Нет в наличии
                            </Badge>
                          )}
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
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={!item.inStock}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={!item.inStock}
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
                            onClick={() => removeItem(item.id)}
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
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Промокод"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                  />
                  <Button 
                    variant="outline" 
                    onClick={applyPromo}
                    disabled={promoApplied || !promoCode}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-sm text-green-600 mb-4">Промокод применён: -10%</p>
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
