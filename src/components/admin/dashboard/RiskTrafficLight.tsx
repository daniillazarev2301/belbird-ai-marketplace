import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: "critical" | "warning" | "ok";
  action?: string;
}

const RiskTrafficLight = () => {
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeRisks();
  }, []);

  const analyzeRisks = async () => {
    const risks: RiskItem[] = [];

    // Check for low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, name, stock_count')
      .eq('is_active', true)
      .lt('stock_count', 10)
      .order('stock_count', { ascending: true })
      .limit(3);

    if (lowStockProducts) {
      lowStockProducts.forEach((product, index) => {
        if ((product.stock_count ?? 0) === 0) {
          risks.push({
            id: `stock-${product.id}`,
            title: `Нет в наличии: ${product.name.slice(0, 30)}...`,
            description: `Товар закончился на складе`,
            level: "critical",
            action: "Заказать",
          });
        } else if ((product.stock_count ?? 0) < 5) {
          risks.push({
            id: `stock-${product.id}`,
            title: `Низкий остаток: ${product.name.slice(0, 30)}...`,
            description: `Осталось ${product.stock_count} шт.`,
            level: "critical",
            action: "Заказать",
          });
        } else {
          risks.push({
            id: `stock-${product.id}`,
            title: `Мало на складе: ${product.name.slice(0, 30)}...`,
            description: `Осталось ${product.stock_count} шт.`,
            level: "warning",
            action: "Пополнить",
          });
        }
      });
    }

    // Check for pending orders
    const { data: pendingOrders, count } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    if (count && count > 0) {
      risks.push({
        id: 'pending-orders',
        title: `Необработанные заказы`,
        description: `${count} заказов ожидают обработки`,
        level: count > 5 ? "warning" : "ok",
        action: count > 0 ? "Обработать" : undefined,
      });
    }

    // Check for products without images
    const { data: noImageProducts, count: noImageCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .or('images.is.null,images.eq.{}');

    if (noImageCount && noImageCount > 0) {
      risks.push({
        id: 'no-images',
        title: `Товары без изображений`,
        description: `${noImageCount} активных товаров без фото`,
        level: "warning",
        action: "Добавить",
      });
    }

    // If no risks found, show OK status
    if (risks.length === 0) {
      risks.push({
        id: 'all-ok',
        title: "Всё в порядке",
        description: "Нет критических проблем",
        level: "ok",
      });
    }

    setRiskItems(risks);
    setLoading(false);
  };

  const criticalCount = riskItems.filter(r => r.level === "critical").length;
  const warningCount = riskItems.filter(r => r.level === "warning").length;

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">AI-Светофор рисков</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">AI-Светофор рисков</CardTitle>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              {warningCount}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {riskItems.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Анализ рисков...
          </div>
        ) : (
          riskItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                item.level === "critical" && "bg-destructive/5 border-destructive/20",
                item.level === "warning" && "bg-secondary/10 border-secondary/20",
                item.level === "ok" && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {item.level === "critical" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {item.level === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-secondary" />
                )}
                {item.level === "ok" && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              {item.action && (
                <button className={cn(
                  "shrink-0 text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all",
                  item.level === "critical" && "text-destructive",
                  item.level === "warning" && "text-secondary"
                )}>
                  {item.action}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RiskTrafficLight;
