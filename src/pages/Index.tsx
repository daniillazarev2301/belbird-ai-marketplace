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

const Index = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Популярные товары BelBird",
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

  return (
    <>
      <Helmet>
        <title>BelBird — Зоотовары для домашних и сельскохозяйственных животных | Купить корма онлайн</title>
        <meta
          name="description"
          content="Купить зоотовары в интернет-магазине BelBird. Корма для собак, кошек, птиц, грызунов, рыбок, кур и цыплят. AI-рекомендации, быстрая доставка по России. Более 50 000 товаров."
        />
        <meta name="keywords" content="зоотовары, корм для собак, корм для кошек, корм для кур, корм для цыплят, товары для птиц, аквариумы, интернет-магазин для животных" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://belbird.ru" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BelBird — Зоотовары для домашних и сельскохозяйственных животных" />
        <meta property="og:description" content="Интернет-магазин товаров для животных с AI-рекомендациями. Более 50 000 товаров." />
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
          <StoriesSection />
          <BenefitsSection />
          <AIRecommendations />
          <CategorySection />
          <FeaturedProducts />
          <PromoSection />
        </main>

        <Footer />
        <MobileNav />
        <AIChatWidget />
      </div>
    </>
  );
};

export default Index;