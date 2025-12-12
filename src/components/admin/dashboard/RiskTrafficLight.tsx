import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: "critical" | "warning" | "ok";
  action?: string;
}

const riskItems: RiskItem[] = [
  {
    id: "1",
    title: "Низкий остаток: Royal Canin Indoor",
    description: "Осталось 5 шт. Прогноз: закончится через 3 дня",
    level: "critical",
    action: "Заказать",
  },
  {
    id: "2",
    title: "Аномальные возвраты",
    description: "Товар 'Лежанка XL' - 8 возвратов за неделю",
    level: "warning",
    action: "Проверить",
  },
  {
    id: "3",
    title: "Высокий спрос: Семена томатов",
    description: "Рост продаж +150% за неделю",
    level: "warning",
    action: "Пополнить",
  },
  {
    id: "4",
    title: "Все системы работают",
    description: "Платежи, доставка, склад — в норме",
    level: "ok",
  },
];

const RiskTrafficLight = () => {
  const criticalCount = riskItems.filter(r => r.level === "critical").length;
  const warningCount = riskItems.filter(r => r.level === "warning").length;

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
        {riskItems.map((item) => (
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
        ))}
      </CardContent>
    </Card>
  );
};

export default RiskTrafficLight;
