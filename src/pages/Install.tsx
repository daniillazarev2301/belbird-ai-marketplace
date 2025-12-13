import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  Download, 
  Zap, 
  Bell, 
  WifiOff, 
  Check,
  Share,
  PlusSquare,
  MoreHorizontal
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: "Мгновенный запуск",
      description: "Приложение открывается за доли секунды"
    },
    {
      icon: WifiOff,
      title: "Работает офлайн",
      description: "Просматривайте каталог без интернета"
    },
    {
      icon: Bell,
      title: "Уведомления",
      description: "Узнавайте о скидках и статусе заказа"
    },
    {
      icon: Smartphone,
      title: "Как настоящее приложение",
      description: "Полноэкранный режим без браузера"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Установить приложение — BelBird</title>
        <meta name="description" content="Установите приложение BelBird на ваш телефон для быстрого доступа к каталогу и заказам" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 pb-24 lg:pb-12">
          <div className="max-w-2xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <img src="/pwa-192x192.png" alt="BelBird" className="w-16 h-16" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Установите BelBird</h1>
              <p className="text-muted-foreground">
                Добавьте приложение на главный экран для быстрого доступа
              </p>
            </div>

            {/* Install Status */}
            {isInstalled ? (
              <Card className="mb-8 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="p-6 text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h2 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-200">
                    Приложение установлено!
                  </h2>
                  <p className="text-green-700 dark:text-green-300">
                    BelBird уже добавлен на ваш главный экран
                  </p>
                </CardContent>
              </Card>
            ) : isIOS ? (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-center">
                    Как установить на iPhone/iPad
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Нажмите кнопку «Поделиться»</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Share className="h-4 w-4" /> внизу экрана Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Выберите «На экран Домой»</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <PlusSquare className="h-4 w-4" /> в меню действий
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Нажмите «Добавить»</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Приложение появится на главном экране
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : deferredPrompt ? (
              <Card className="mb-8">
                <CardContent className="p-6 text-center">
                  <Button size="lg" className="gap-2" onClick={handleInstall}>
                    <Download className="h-5 w-5" />
                    Установить приложение
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    Бесплатно • Занимает менее 1 МБ
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-center">
                    Как установить
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Откройте меню браузера</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MoreHorizontal className="h-4 w-4" /> три точки в правом верхнем углу
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Выберите «Установить приложение»</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          или «Добавить на главный экран»
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>

        <Footer />
        <MobileNav />
      </div>
    </>
  );
};

export default Install;