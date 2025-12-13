import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // For iOS, show instructions prompt after delay
    if (iOS) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show prompt after delay even without event (for manual install)
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Show manual instructions for Android Chrome
      setShowIOSInstructions(true);
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (isInstalled) return null;

  // iOS/Android Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold mb-4">Как установить приложение</h3>
            {isIOS ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Нажмите на кнопку <Share className="inline h-4 w-4 mx-1" /> Поделиться внизу экрана Safari
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Прокрутите вниз и нажмите <Plus className="inline h-4 w-4 mx-1" /> На экран «Домой»
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Нажмите «Добавить» в правом верхнем углу
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Откройте меню браузера (⋮) в правом верхнем углу
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Выберите «Установить приложение» или «Добавить на главный экран»
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Подтвердите установку
                  </p>
                </div>
              </div>
            )}
            <Button className="w-full mt-6" onClick={handleDismiss}>
              Понятно
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-primary/20 shadow-lg bg-background/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Установите приложение</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Быстрый доступ к магазину с рабочего стола
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDismiss}
            >
              Позже
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              {isIOS || !deferredPrompt ? "Как установить" : "Установить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};