import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load all other pages
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Search = lazy(() => import("./pages/Search"));
const Product = lazy(() => import("./pages/Product"));
const Auth = lazy(() => import("./pages/Auth"));
const Catalog = lazy(() => import("./pages/Catalog"));
const StaticPage = lazy(() => import("./pages/StaticPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Compare = lazy(() => import("./pages/Compare"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const Install = lazy(() => import("./pages/Install"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductEdit = lazy(() => import("./pages/admin/AdminProductEdit"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAIContent = lazy(() => import("./pages/admin/AdminAIContent"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminStories = lazy(() => import("./pages/admin/AdminStories"));
const AdminABTests = lazy(() => import("./pages/admin/AdminABTests"));
const AdminPushNotifications = lazy(() => import("./pages/admin/AdminPushNotifications"));

// Account pages
const AccountProfile = lazy(() => import("./pages/account/AccountProfile"));
const AccountOrders = lazy(() => import("./pages/account/AccountOrders"));
const AccountPets = lazy(() => import("./pages/account/AccountPets"));
const AccountSubscriptions = lazy(() => import("./pages/account/AccountSubscriptions"));
const AccountLoyalty = lazy(() => import("./pages/account/AccountLoyalty"));
const AccountFavorites = lazy(() => import("./pages/account/AccountFavorites"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/install" element={<Install />} />
                
                {/* Static Pages */}
                <Route path="/about" element={<StaticPage />} />
                <Route path="/privacy" element={<StaticPage />} />
                <Route path="/terms" element={<StaticPage />} />
                <Route path="/delivery" element={<StaticPage />} />
                <Route path="/returns" element={<StaticPage />} />
                <Route path="/faq" element={<StaticPage />} />
                <Route path="/contacts" element={<StaticPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
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
                <Route path="/account/addresses" element={<AccountAddresses />} />
                
                {/* Admin */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/:id" element={<AdminProductEdit />} />
                <Route path="/admin/ai-content" element={<AdminAIContent />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/brands" element={<AdminBrands />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/pages" element={<AdminPages />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/admin/delivery" element={<AdminDelivery />} />
                <Route path="/admin/stories" element={<AdminStories />} />
                <Route path="/admin/ab-tests" element={<AdminABTests />} />
                <Route path="/admin/push-notifications" element={<AdminPushNotifications />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
