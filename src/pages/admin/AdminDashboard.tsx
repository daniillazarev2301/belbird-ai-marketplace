import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import RiskTrafficLight from "@/components/admin/dashboard/RiskTrafficLight";
import SalesForecast from "@/components/admin/dashboard/SalesForecast";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import TopProducts from "@/components/admin/dashboard/TopProducts";
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  return (
    <>
      <Helmet>
        <title>Дашборд — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Дашборд" description="Обзор ключевых метрик и показателей">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Выручка сегодня"
            value="128,450 ₽"
            change={12.5}
            changeLabel="vs вчера"
            icon={TrendingUp}
          />
          <MetricCard
            title="Заказов сегодня"
            value="47"
            change={8}
            changeLabel="vs вчера"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Новых клиентов"
            value="23"
            change={-3}
            changeLabel="vs вчера"
            icon={Users}
          />
          <MetricCard
            title="Товаров в наличии"
            value="12,847"
            change={0.5}
            changeLabel="vs вчера"
            icon={Package}
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
