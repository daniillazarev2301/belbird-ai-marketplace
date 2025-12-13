import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-main.jpg";
import { useEffect, useState } from "react";

const FloatingParticle = ({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) => (
  <div
    className="absolute rounded-full bg-primary/20 blur-sm animate-float pointer-events-none"
    style={{
      width: size,
      height: size,
      left: `${left}%`,
      bottom: '-20px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
);

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

  const particles = [
    { delay: 0, size: 12, left: 10, duration: 8 },
    { delay: 2, size: 8, left: 25, duration: 10 },
    { delay: 1, size: 16, left: 40, duration: 12 },
    { delay: 3, size: 10, left: 55, duration: 9 },
    { delay: 0.5, size: 14, left: 70, duration: 11 },
    { delay: 2.5, size: 6, left: 85, duration: 8 },
    { delay: 1.5, size: 20, left: 95, duration: 14 },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background Image with Parallax */}
      <div 
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.1)` }}
      >
        <img
          src={heroImage}
          alt="Уютный дом с питомцем"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, index) => (
          <FloatingParticle key={index} {...particle} />
        ))}
      </div>

      {/* Animated Glow Orbs */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

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

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
