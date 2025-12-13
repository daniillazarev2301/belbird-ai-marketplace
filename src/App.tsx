import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Search from "./pages/Search";
import Product from "./pages/Product";
import Auth from "./pages/Auth";
import Catalog from "./pages/Catalog";
import StaticPage from "./pages/StaticPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAIContent from "./pages/admin/AdminAIContent";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPages from "./pages/admin/AdminPages";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminDelivery from "./pages/admin/AdminDelivery";
import Compare from "./pages/Compare";
import PaymentResult from "./pages/PaymentResult";
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
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/catalog/:category" element={<Catalog />} />
              <Route path="/search" element={<Search />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/compare" element={<Compare />} />
              
              {/* Static Pages */}
              <Route path="/about" element={<StaticPage />} />
              <Route path="/privacy" element={<StaticPage />} />
              <Route path="/terms" element={<StaticPage />} />
              <Route path="/delivery" element={<StaticPage />} />
              <Route path="/returns" element={<StaticPage />} />
              <Route path="/faq" element={<StaticPage />} />
              <Route path="/contacts" element={<StaticPage />} />
              <Route path="/blog" element={<StaticPage />} />
              <Route path="/careers" element={<StaticPage />} />
              <Route path="/partners" element={<StaticPage />} />
              
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
              <Route path="/admin/products/:id" element={<AdminProductEdit />} />
              <Route path="/admin/ai-content" element={<AdminAIContent />} />
              <Route path="/admin/media" element={<AdminMedia />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/pages" element={<AdminPages />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
              <Route path="/admin/delivery" element={<AdminDelivery />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;