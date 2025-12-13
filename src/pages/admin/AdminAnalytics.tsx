import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, TrendingUp, TrendingDown, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"];

const AdminAnalytics = () => {
  const [period, setPeriod] = useState("30d");

  // Get date range based on period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    return { start, end };
  };

  // Fetch orders data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["admin-analytics", period],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      // Get orders in date range
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, shipping_address")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get previous period for comparison
      const prevStart = new Date(start);
      const prevEnd = new Date(start);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      prevStart.setDate(prevStart.getDate() - daysDiff);

      const { data: prevOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", start.toISOString());

      // Calculate metrics
      const currentOrders = orders || [];
      const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalOrders = currentOrders.length;
      const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const prevRevenue = (prevOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
      const prevOrdersCount = (prevOrders || []).length;
      const prevAvgCheck = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersChange = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;
      const avgCheckChange = prevAvgCheck > 0 ? ((avgCheck - prevAvgCheck) / prevAvgCheck) * 100 : 0;

      // Group by date for chart
      const dailyData: Record<string, { revenue: number; orders: number }> = {};
      currentOrders.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, orders: 0 };
        }
        dailyData[date].revenue += Number(order.total_amount);
        dailyData[date].orders += 1;
      });

      const chartData = Object.entries(dailyData).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));

      // Get category data from products
      const { data: products } = await supabase
        .from("products")
        .select("category_id, price, stock_count, categories(name)");

      const categoryStats: Record<string, { name: string; count: number; value: number }> = {};
      products?.forEach((p) => {
        const catName = (p.categories as { name: string } | null)?.name || "Без категории";
        if (!categoryStats[catName]) {
          categoryStats[catName] = { name: catName, count: 0, value: 0 };
        }
        categoryStats[catName].count += 1;
        categoryStats[catName].value += Number(p.price) * (p.stock_count || 0);
      });

      const totalProducts = products?.length || 1;
      const categoryData = Object.values(categoryStats).map((cat) => ({
        name: cat.name,
        value: Math.round((cat.count / totalProducts) * 100),
        revenue: cat.value,
      }));

      // Get customers count
      const { count: customersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      return {
        totalRevenue,
        totalOrders,
        avgCheck,
        revenueChange,
        ordersChange,
        avgCheckChange,
        chartData,
        categoryData: categoryData.length > 0 ? categoryData : [
          { name: "Нет данных", value: 100, revenue: 0 }
        ],
        customersCount: customersCount || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Аналитика — BelBird Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <AdminLayout title="Аналитика" description="Детальная статистика и отчёты">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AdminLayout>
      </>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M ₽`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₽`;
    return `${value.toFixed(0)} ₽`;
  };

  return (
    <>
      <Helmet>
        <title>Аналитика — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Аналитика" description="Детальная статистика и отчёты">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
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
              <p className="text-2xl font-semibold mt-1">{formatCurrency(analyticsData?.totalRevenue || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                {(analyticsData?.revenueChange || 0) >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">+{(analyticsData?.revenueChange || 0).toFixed(0)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{(analyticsData?.revenueChange || 0).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Заказов</p>
              <p className="text-2xl font-semibold mt-1">{analyticsData?.totalOrders || 0}</p>
              <div className="flex items-center gap-1 mt-1">
                {(analyticsData?.ordersChange || 0) >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">+{(analyticsData?.ordersChange || 0).toFixed(0)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{(analyticsData?.ordersChange || 0).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Средний чек</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(analyticsData?.avgCheck || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                {(analyticsData?.avgCheckChange || 0) >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">+{(analyticsData?.avgCheckChange || 0).toFixed(0)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{(analyticsData?.avgCheckChange || 0).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Клиентов</p>
              <p className="text-2xl font-semibold mt-1">{analyticsData?.customersCount || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">в базе</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Выручка</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Динамика выручки</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.chartData && analyticsData.chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatCurrency(value), "Выручка"]}
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
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Нет данных за выбранный период
                  </div>
                )}
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
                {analyticsData?.chartData && analyticsData.chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.chartData}>
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
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    Нет данных за выбранный период
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение товаров по категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData?.categoryData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {(analyticsData?.categoryData || []).map((entry, index) => (
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
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {(analyticsData?.categoryData || []).map((cat, idx) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm">{cat.name} ({cat.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Стоимость товаров по категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analyticsData?.categoryData || []).map((cat, idx) => (
                      <div key={cat.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-sm font-medium">{formatCurrency(cat.revenue)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cat.value}%`,
                              backgroundColor: COLORS[idx % COLORS.length],
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
        </Tabs>
      </AdminLayout>
    </>
  );
};

export default AdminAnalytics;
