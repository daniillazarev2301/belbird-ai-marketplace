import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import StoriesSection from "@/components/home/StoriesSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromoSection from "@/components/home/PromoSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import AIRecommendations from "@/components/home/AIRecommendations";
import AIChatWidget from "@/components/chat/AIChatWidget";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { settings } = useSiteSettings();
  
  const siteName = settings?.general?.site_name || "BelBird";
  const tagline = settings?.general?.tagline || "Премиальный зоомагазин";
  const seo = settings?.seo;
  const faviconUrl = settings?.general?.favicon_url;
  const features = settings?.features;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Популярные товары ${siteName}`,
    "numberOfItems": 8,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Product",
          "name": "Корм для собак",
          "category": "Зоотовары"
        }
      }
    ]
  };

  const pageTitle = seo?.meta_title || `${siteName} — Зоотовары для домашних и сельскохозяйственных животных | Купить корма онлайн`;
  const pageDescription = seo?.meta_description || "Купить зоотовары в интернет-магазине. Корма для собак, кошек, птиц, грызунов, рыбок. AI-рекомендации, быстрая доставка по России.";
  const pageKeywords = seo?.meta_keywords || "зоотовары, корм для собак, корм для кошек, интернет-магазин для животных";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://belbird.ru" />
        
        {faviconUrl && (
          <link rel="icon" href={faviconUrl} />
        )}
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${siteName} — ${tagline}`} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content="https://belbird.ru" />
        <meta property="og:image" content="https://belbird.ru/og-image.jpg" />
        <meta property="og:locale" content="ru_RU" />
        
        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          <HeroSection />
          {features?.show_stories !== false && <StoriesSection />}
          <BenefitsSection />
          {features?.show_ai_recommendations !== false && <AIRecommendations />}
          <CategorySection />
          <FeaturedProducts />
          {features?.show_promo_banner !== false && <PromoSection />}
        </main>

        <Footer />
        <MobileNav />
        {features?.enable_chat !== false && <AIChatWidget />}
      </div>
    </>
  );
};

export default Index;