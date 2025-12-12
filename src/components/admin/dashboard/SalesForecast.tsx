import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const salesData = [
  { date: "01 Дек", actual: 245000, forecast: null },
  { date: "05 Дек", actual: 312000, forecast: null },
  { date: "10 Дек", actual: 428000, forecast: null },
  { date: "15 Дек", actual: null, forecast: 520000 },
  { date: "20 Дек", actual: null, forecast: 680000 },
  { date: "25 Дек", actual: null, forecast: 890000 },
  { date: "31 Дек", actual: null, forecast: 750000 },
];

const categoryForecast = [
  { category: "Любимцы", forecast: 1250000, change: 18 },
  { category: "Уют и Дом", forecast: 890000, change: 12 },
  { category: "Сад и Огород", forecast: 420000, change: -5 },
];

const SalesForecast = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">AI-Прогноз продаж</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Декабрь 2024</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-48 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}K`}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${(value / 1000).toFixed(0)}K ₽`, '']}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorActual)"
                name="Факт"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorForecast)"
                name="Прогноз"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">Факт</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-secondary rounded border-dashed" style={{ borderStyle: 'dashed' }} />
            <span className="text-muted-foreground">Прогноз AI</span>
          </div>
        </div>

        {/* Category Forecasts */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm font-medium mb-3">Прогноз по категориям</p>
          <div className="space-y-2">
            {categoryForecast.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {(cat.forecast / 1000000).toFixed(1)}M ₽
                  </span>
                  <Badge 
                    variant={cat.change >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {cat.change >= 0 ? "+" : ""}{cat.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesForecast;
