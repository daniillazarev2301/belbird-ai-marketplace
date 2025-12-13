import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-main.jpg";

const HeroSection = () => {
  const scrollToChat = () => {
    // Trigger AI chat widget open
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
    if (chatButton) chatButton.click();
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Уютный дом с питомцем"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container px-4 md:px-6 py-16 md:py-24 lg:py-32">
        <div className="max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground mb-6">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">AI-рекомендации</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold tracking-tight mb-4">
            Зоотовары для всех
            <span className="block text-primary">ваших питомцев</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Корма и товары для домашних и сельскохозяйственных животных: собаки, кошки, птицы, 
            грызуны, рыбки, а также куры, цыплята и другие. С AI-рекомендациями.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="gap-2 text-base" asChild>
              <Link to="/catalog">
                Начать покупки
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base" onClick={scrollToChat}>
              <Sparkles className="h-4 w-4" />
              AI-консультант
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-border/50">
            <div>
              <p className="text-2xl font-semibold">50K+</p>
              <p className="text-sm text-muted-foreground">товаров</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">10K+</p>
              <p className="text-sm text-muted-foreground">отзывов</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">4.9</p>
              <p className="text-sm text-muted-foreground">рейтинг</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
