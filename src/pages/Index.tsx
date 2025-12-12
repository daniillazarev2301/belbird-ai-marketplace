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
  return (
    <>
      <Helmet>
        <title>BelBird — Премиальный маркетплейс для питомцев, дома и сада</title>
        <meta
          name="description"
          content="BelBird — современный маркетплейс с AI-персонализацией. Товары для питомцев, уюта дома и сада. Быстрая доставка, гарантия качества."
        />
        <meta property="og:title" content="BelBird — Премиальный маркетплейс" />
        <meta
          property="og:description"
          content="Товары для питомцев, уюта дома и сада с AI-рекомендациями"
        />
        <link rel="canonical" href="https://belbird.ru" />
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
