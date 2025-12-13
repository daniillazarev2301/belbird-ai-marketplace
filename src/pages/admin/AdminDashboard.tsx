import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import RiskTrafficLight from "@/components/admin/dashboard/RiskTrafficLight";
import SalesForecast from "@/components/admin/dashboard/SalesForecast";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import TopProducts from "@/components/admin/dashboard/TopProducts";
import { ShoppingCart, Users, Package, TrendingUp, Loader2 } from "lucide-react";
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

      // Get categories count
      const { count: categoriesCount } = await supabase
        .from("categories")
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
        categoriesCount: categoriesCount || 0,
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
            title="Активных товаров"
            value={metrics?.productsCount.toLocaleString() || "0"}
            change={0}
            changeLabel="в каталоге"
            icon={Package}
          />
          <MetricCard
            title="Общий остаток"
            value={metrics?.totalStock.toLocaleString() || "0"}
            change={0}
            changeLabel="единиц товара"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Категорий"
            value={metrics?.categoriesCount.toString() || "0"}
            change={0}
            changeLabel="в структуре"
            icon={TrendingUp}
          />
          <MetricCard
            title="Мало на складе"
            value={(metrics?.lowStockCount || 0).toString()}
            change={metrics?.outOfStockCount || 0}
            changeLabel="нет в наличии"
            icon={Users}
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