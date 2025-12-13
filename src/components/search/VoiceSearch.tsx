import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VoiceSearchProps {
  onResult: (text: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceSearch = ({ onResult, isOpen, onOpenChange }: VoiceSearchProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Голосовой поиск не поддерживается вашим браузером");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        onResult(text);
        onOpenChange(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        setError("Речь не распознана. Попробуйте ещё раз.");
      } else if (event.error === "not-allowed") {
        setError("Доступ к микрофону запрещён");
      } else {
        setError("Ошибка распознавания речи");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [onResult, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      startListening();
    }
  }, [isOpen, startListening]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="py-8">
          <div
            className={cn(
              "relative mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all",
              isListening
                ? "bg-primary animate-pulse"
                : error
                ? "bg-destructive"
                : "bg-muted"
            )}
          >
            {isListening ? (
              <>
                <Mic className="h-10 w-10 text-primary-foreground" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
              </>
            ) : error ? (
              <MicOff className="h-10 w-10 text-destructive-foreground" />
            ) : (
              <Mic className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="mt-6 min-h-[60px]">
            {isListening && (
              <>
                <p className="text-lg font-medium">Слушаю...</p>
                {transcript && (
                  <p className="text-muted-foreground mt-2">"{transcript}"</p>
                )}
              </>
            )}

            {error && (
              <>
                <p className="text-destructive font-medium">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={startListening}
                >
                  Попробовать снова
                </Button>
              </>
            )}

            {!isListening && !error && (
              <p className="text-muted-foreground">Нажмите на микрофон для поиска голосом</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSearch;