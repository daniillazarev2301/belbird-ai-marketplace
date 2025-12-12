import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Search from "./pages/Search";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAIContent from "./pages/admin/AdminAIContent";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminCategories from "./pages/admin/AdminCategories";
import AccountProfile from "./pages/account/AccountProfile";
import AccountOrders from "./pages/account/AccountOrders";
import AccountPets from "./pages/account/AccountPets";
import AccountSubscriptions from "./pages/account/AccountSubscriptions";
import AccountLoyalty from "./pages/account/AccountLoyalty";
import AccountFavorites from "./pages/account/AccountFavorites";
import AccountSettings from "./pages/account/AccountSettings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            {/* Account */}
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/account/orders" element={<AccountOrders />} />
            <Route path="/account/favorites" element={<AccountFavorites />} />
            <Route path="/account/pets" element={<AccountPets />} />
            <Route path="/account/subscriptions" element={<AccountSubscriptions />} />
            <Route path="/account/loyalty" element={<AccountLoyalty />} />
            <Route path="/account/settings" element={<AccountSettings />} />
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/ai-content" element={<AdminAIContent />} />
            <Route path="/admin/media" element={<AdminMedia />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
