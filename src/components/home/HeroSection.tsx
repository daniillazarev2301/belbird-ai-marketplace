import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-main.jpg";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChat = () => {
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
    if (chatButton) chatButton.click();
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background Image with Breathing Animation */}
      <div 
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <div className="relative w-full h-full animate-breathing">
          <img
            src={heroImage}
            alt="Питомцы - собака, кошка, попугай, кролик, цыплята"
            className="w-full h-full object-cover"
          />
          {/* Shimmer overlay for "alive" effect */}
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      {/* Glowing spots on animals positions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dog glow */}
        <div 
          className="absolute w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-glow-pulse"
          style={{ top: '35%', left: '55%' }}
        />
        {/* Cat glow */}
        <div 
          className="absolute w-24 h-24 bg-secondary/20 rounded-full blur-2xl animate-glow-pulse"
          style={{ top: '40%', left: '62%', animationDelay: '0.5s' }}
        />
        {/* Parrot glow */}
        <div 
          className="absolute w-20 h-20 bg-destructive/15 rounded-full blur-2xl animate-glow-pulse"
          style={{ top: '30%', left: '82%', animationDelay: '1s' }}
        />
        {/* Chicks glow */}
        <div 
          className="absolute w-40 h-20 bg-yellow-400/20 rounded-full blur-2xl animate-glow-pulse"
          style={{ top: '65%', left: '58%', animationDelay: '0.3s' }}
        />
      </div>

      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-sparkle"
            style={{
              top: `${30 + Math.random() * 40}%`,
              left: `${50 + Math.random() * 45}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div 
        className="relative container px-4 md:px-6 py-16 md:py-24 lg:py-32"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <div className="max-w-xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground mb-6 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
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
            <Button size="lg" className="gap-2 text-base hover-scale" asChild>
              <Link to="/catalog">
                Начать покупки
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base hover-scale backdrop-blur-sm" onClick={scrollToChat}>
              <Sparkles className="h-4 w-4" />
              AI-консультант
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-border/50">
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-2xl font-semibold">50K+</p>
              <p className="text-sm text-muted-foreground">товаров</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <p className="text-2xl font-semibold">10K+</p>
              <p className="text-sm text-muted-foreground">отзывов</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p className="text-2xl font-semibold">4.9</p>
              <p className="text-sm text-muted-foreground">рейтинг</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes breathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-breathing {
          animation: breathing 4s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
