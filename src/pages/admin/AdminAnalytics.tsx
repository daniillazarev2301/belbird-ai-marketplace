import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";

const revenueData = [
  { date: "01.12", revenue: 125000, orders: 42 },
  { date: "02.12", revenue: 145000, orders: 48 },
  { date: "03.12", revenue: 132000, orders: 44 },
  { date: "04.12", revenue: 168000, orders: 56 },
  { date: "05.12", revenue: 189000, orders: 63 },
  { date: "06.12", revenue: 156000, orders: 52 },
  { date: "07.12", revenue: 178000, orders: 59 },
  { date: "08.12", revenue: 195000, orders: 65 },
  { date: "09.12", revenue: 212000, orders: 71 },
  { date: "10.12", revenue: 198000, orders: 66 },
  { date: "11.12", revenue: 225000, orders: 75 },
  { date: "12.12", revenue: 245000, orders: 82 },
];

const categoryData = [
  { name: "Любимцы", value: 45, revenue: 1250000 },
  { name: "Дом", value: 35, revenue: 890000 },
  { name: "Сад", value: 20, revenue: 420000 },
];

const topCities = [
  { city: "Москва", orders: 1250, revenue: 3450000 },
  { city: "Санкт-Петербург", orders: 680, revenue: 1890000 },
  { city: "Казань", orders: 320, revenue: 890000 },
  { city: "Новосибирск", orders: 280, revenue: 780000 },
  { city: "Екатеринбург", orders: 245, revenue: 680000 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"];

const AdminAnalytics = () => {
  return (
    <>
      <Helmet>
        <title>Аналитика — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Аналитика" description="Детальная статистика и отчёты">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Select defaultValue="7d">
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
                <SelectItem value="90d">90 дней</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Экспорт отчёта
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Выручка</p>
              <p className="text-2xl font-semibold mt-1">2.56M ₽</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">+18%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Заказов</p>
              <p className="text-2xl font-semibold mt-1">723</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">+12%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Средний чек</p>
              <p className="text-2xl font-semibold mt-1">3,542 ₽</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">+5%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Конверсия</p>
              <p className="text-2xl font-semibold mt-1">3.2%</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">-0.3%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Выручка</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="geo">География</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Динамика выручки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${(value / 1000).toFixed(0)}K ₽`, "Выручка"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Количество заказов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {categoryData.map((cat, idx) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-sm">{cat.name} ({cat.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Выручка по категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((cat, idx) => (
                      <div key={cat.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-sm font-medium">{(cat.revenue / 1000000).toFixed(2)}M ₽</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cat.value}%`,
                              backgroundColor: COLORS[idx],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geo">
            <Card>
              <CardHeader>
                <CardTitle>Топ городов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCities.map((city, idx) => (
                    <div key={city.city} className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-muted-foreground w-6">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{city.city}</span>
                          <span className="text-sm text-muted-foreground">{city.orders} заказов</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(city.revenue / topCities[0].revenue) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-semibold w-24 text-right">{(city.revenue / 1000000).toFixed(2)}M ₽</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
};

export default AdminAnalytics;
