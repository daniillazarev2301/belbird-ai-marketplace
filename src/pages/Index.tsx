import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";
import AgroHeroSection from "@/components/home/AgroHeroSection";
import BusinessDirections from "@/components/home/BusinessDirections";
import TrustNumbers from "@/components/home/TrustNumbers";
import CTASection from "@/components/home/CTASection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { settings } = useSiteSettings();
  
  const siteName = settings?.general?.site_name || "BelBird";
  const seo = settings?.seo;
  const faviconUrl = settings?.general?.favicon_url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "description": "Поставщик суточной птицы, кормов и оборудования для птицеводства",
    "url": "https://belbird.ru",
    "logo": "https://belbird.ru/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+7-900-123-45-67",
      "contactType": "sales",
      "areaServed": "RU",
      "availableLanguage": "Russian"
    },
    "sameAs": [
      "https://vk.com/belbird",
      "https://t.me/belbird"
    ]
  };

  const pageTitle = seo?.meta_title || `${siteName} — Суточная птица, корма и оборудование для птицеводства`;
  const pageDescription = seo?.meta_description || "Надёжный поставщик суточной птицы, инкубационного яйца, кормов и оборудования. Работаем с фермерами по всей России. Доставка, гарантия качества.";
  const pageKeywords = seo?.meta_keywords || "суточные цыплята, бройлеры, несушки, корм для птицы, инкубационное яйцо, птицеводство, птицеферма";

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
        <meta property="og:title" content={pageTitle} />
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
          <AgroHeroSection />
          <BusinessDirections />
          <FeaturedProducts />
          <TrustNumbers />
          <CTASection />
        </main>

        <Footer />
        <MobileNav />
      </div>
    </>
  );
};

export default Index;