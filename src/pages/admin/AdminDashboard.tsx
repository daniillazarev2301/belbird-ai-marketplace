import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import RiskTrafficLight from "@/components/admin/dashboard/RiskTrafficLight";
import SalesForecast from "@/components/admin/dashboard/SalesForecast";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import TopProducts from "@/components/admin/dashboard/TopProducts";
import { ShoppingCart, Users, Package, TrendingUp, Loader2, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  // Fetch real metrics from database
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: async () => {
      // Get products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get total stock
      const { data: stockData } = await supabase
        .from("products")
        .select("stock_count");
      const totalStock = stockData?.reduce((sum, p) => sum + (p.stock_count || 0), 0) || 0;

      // Get orders data
      const { data: ordersData, count: ordersCount } = await supabase
        .from("orders")
        .select("total_amount, created_at", { count: "exact" });
      
      const totalRevenue = ordersData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      
      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      
      // Get pending orders
      const { count: pendingOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get customers count
      const { count: customersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get low stock products
      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lt("stock_count", 10)
        .gt("stock_count", 0);

      // Get out of stock products
      const { count: outOfStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("stock_count", 0);

      return {
        productsCount: productsCount || 0,
        totalStock,
        ordersCount: ordersCount || 0,
        todayOrdersCount: todayOrdersCount || 0,
        pendingOrdersCount: pendingOrdersCount || 0,
        totalRevenue,
        customersCount: customersCount || 0,
        lowStockCount: lowStockCount || 0,
        outOfStockCount: outOfStockCount || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Дашборд — BelBird Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <AdminLayout title="Дашборд" description="Обзор ключевых метрик и показателей">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AdminLayout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Дашборд — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Дашборд" description="Обзор ключевых метрик и показателей">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Выручка"
            value={`${(metrics?.totalRevenue || 0).toLocaleString()} ₽`}
            change={metrics?.todayOrdersCount || 0}
            changeLabel="заказов сегодня"
            icon={DollarSign}
          />
          <MetricCard
            title="Всего заказов"
            value={metrics?.ordersCount.toString() || "0"}
            change={metrics?.pendingOrdersCount || 0}
            changeLabel="ожидают обработки"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Клиентов"
            value={metrics?.customersCount.toString() || "0"}
            change={0}
            changeLabel="зарегистрировано"
            icon={Users}
          />
          <MetricCard
            title="Мало на складе"
            value={(metrics?.lowStockCount || 0).toString()}
            change={metrics?.outOfStockCount || 0}
            changeLabel="нет в наличии"
            icon={AlertTriangle}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <SalesForecast />
            <RecentOrders />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
          <RiskTrafficLight />
            <TopProducts />
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;