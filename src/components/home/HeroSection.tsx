import { ArrowRight, Sparkles, PawPrint, Bird, Fish, Rabbit } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-main.jpg";
import { useEffect, useState } from "react";

const FloatingAnimal = ({ 
  icon: Icon, 
  delay, 
  left, 
  duration, 
  size,
  animationType 
}: { 
  icon: React.ElementType;
  delay: number; 
  left: number; 
  duration: number;
  size: number;
  animationType: 'float' | 'fly' | 'swim' | 'hop';
}) => (
  <div
    className={`absolute text-primary/30 pointer-events-none animate-${animationType}`}
    style={{
      left: `${left}%`,
      bottom: animationType === 'fly' ? '70%' : animationType === 'swim' ? '20%' : '-20px',
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <Icon size={size} />
  </div>
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

  const animals = [
    { icon: PawPrint, delay: 0, left: 5, duration: 10, size: 24, animationType: 'float' as const },
    { icon: Bird, delay: 1, left: 75, duration: 8, size: 28, animationType: 'fly' as const },
    { icon: PawPrint, delay: 2, left: 20, duration: 12, size: 20, animationType: 'float' as const },
    { icon: Fish, delay: 0.5, left: 85, duration: 6, size: 22, animationType: 'swim' as const },
    { icon: Bird, delay: 3, left: 60, duration: 9, size: 24, animationType: 'fly' as const },
    { icon: Rabbit, delay: 1.5, left: 90, duration: 4, size: 26, animationType: 'hop' as const },
    { icon: PawPrint, delay: 2.5, left: 35, duration: 11, size: 18, animationType: 'float' as const },
    { icon: Fish, delay: 4, left: 70, duration: 7, size: 20, animationType: 'swim' as const },
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

      {/* Animated Animals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {animals.map((animal, index) => (
          <FloatingAnimal key={index} {...animal} />
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

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(-100vh) rotate(20deg);
            opacity: 0;
          }
        }
        
        @keyframes fly {
          0% {
            transform: translateX(-50px) translateY(0);
            opacity: 0;
          }
          10% { opacity: 0.5; }
          50% { transform: translateX(100px) translateY(-30px); }
          90% { opacity: 0.5; }
          100% {
            transform: translateX(200px) translateY(0);
            opacity: 0;
          }
        }
        
        @keyframes swim {
          0% {
            transform: translateX(-30px) scaleX(1);
            opacity: 0;
          }
          10% { opacity: 0.5; }
          25% { transform: translateX(50px) translateY(-10px) scaleX(1); }
          50% { transform: translateX(100px) translateY(5px) scaleX(-1); }
          75% { transform: translateX(50px) translateY(-5px) scaleX(-1); }
          90% { opacity: 0.5; }
          100% {
            transform: translateX(-30px) scaleX(1);
            opacity: 0;
          }
        }
        
        @keyframes hop {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          20% { transform: translateY(-40px) translateX(20px) scale(1.1); }
          30% { transform: translateY(0) translateX(40px) scale(1); }
          40% { transform: translateY(-30px) translateX(60px) scale(1.05); }
          50% { transform: translateY(0) translateX(80px) scale(1); }
          60% { transform: translateY(-50px) translateX(100px) scale(1.1); }
          70% { transform: translateY(0) translateX(120px) scale(1); }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(-20px) translateX(150px);
            opacity: 0;
          }
        }
        
        .animate-float { animation: float linear infinite; }
        .animate-fly { animation: fly ease-in-out infinite; }
        .animate-swim { animation: swim ease-in-out infinite; }
        .animate-hop { animation: hop ease-in-out infinite; }
      `}</style>
    </section>
  );
};

export default HeroSection;
