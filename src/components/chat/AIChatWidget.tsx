import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Sparkles, User, Bot, Mic, MicOff, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatProductCard from "./ChatProductCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age_years?: number;
  weight_kg?: number;
  allergies?: string[];
  special_needs?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number | null;
  images?: string[] | null;
  description?: string | null;
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-3 py-2">
    <span className="text-xs text-muted-foreground">Печатает</span>
    <div className="flex gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

// Parse message content and extract product IDs
const parseProductIds = (content: string): string[] => {
  const regex = /\[PRODUCT:([a-f0-9-]+)\]/gi;
  const matches = [...content.matchAll(regex)];
  return matches.map(m => m[1]);
};

// Remove product tags from content for display
const cleanContent = (content: string): string => {
  return content.replace(/\[PRODUCT:[a-f0-9-]+\]/gi, '').trim();
};

// Format message content with markdown-like styling
const FormattedMessage = ({ content, products }: { content: string; products: Product[] }) => {
  const cleanedContent = cleanContent(content);
  
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
      if (line.startsWith('### ')) {
        return <p key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</p>;
      }
      if (line.startsWith('## ')) {
        return <p key={i} className="font-semibold mt-2 mb-1">{line.slice(3)}</p>;
      }
      
      if (line.match(/^[-•*]\s/)) {
        return (
          <div key={i} className="flex gap-2 ml-1">
            <span className="text-primary">•</span>
            <span>{formatInlineText(line.slice(2))}</span>
          </div>
        );
      }
      
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1];
        return (
          <div key={i} className="flex gap-2 ml-1">
            <span className="text-primary font-medium min-w-[1.2rem]">{num}.</span>
            <span>{formatInlineText(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      
      if (!line.trim()) {
        return <div key={i} className="h-2" />;
      }
      
      return <p key={i}>{formatInlineText(line)}</p>;
    });
  };
  
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('__') && part.endsWith('__')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-0.5">
      {formatContent(cleanedContent)}
      {products.length > 0 && (
        <div className="mt-3 space-y-2">
          {products.map(product => (
            <ChatProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

const CHAT_STORAGE_KEY = "belbird_ai_chat_history";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

const AIChatWidget = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [petProfiles, setPetProfiles] = useState<PetProfile[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickActions = [
    { icon: "🐾", text: "Корм для питомца" },
    { icon: "💡", text: "Рекомендации по уходу" },
    { icon: "🔥", text: "Что в тренде?" },
  ];

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Fetch products for product IDs in messages
  useEffect(() => {
    const fetchProducts = async () => {
      const allIds: string[] = [];
      messages.forEach(msg => {
        if (msg.role === "assistant") {
          const ids = parseProductIds(msg.content);
          ids.forEach(id => {
            if (!productCache[id]) {
              allIds.push(id);
            }
          });
        }
      });

      if (allIds.length === 0) return;

      const uniqueIds = [...new Set(allIds)];
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, old_price, images, description')
        .in('id', uniqueIds);

      if (data) {
        const newCache = { ...productCache };
        data.forEach(p => {
          newCache[p.id] = p;
        });
        setProductCache(newCache);
      }
    };

    fetchProducts();
  }, [messages]);

  useEffect(() => {
    const loadPetProfiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("pet_profiles")
          .select("*")
          .eq("user_id", session.user.id);
        if (data) {
          setPetProfiles(data as PetProfile[]);
        }
      }
    };
    loadPetProfiles();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Compress image to base64
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Неверный формат",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер изображения — 4 МБ",
        variant: "destructive",
      });
      return;
    }
    
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPendingImage(compressed);
      toast({
        title: "Изображение добавлено",
        description: "Отправьте сообщение или нажмите на кнопку отправки",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать изображение",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Voice recording setup
  const startRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Не поддерживается",
        description: "Голосовой ввод не поддерживается вашим браузером",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setInput(text);

      if (event.results[current].isFinal) {
        setIsRecording(false);
        if (text.trim()) {
          streamChat(text.trim());
          setInput("");
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        toast({
          title: "Доступ запрещён",
          description: "Разрешите доступ к микрофону",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const streamChat = useCallback(async (userMessage: string, imageData?: string) => {
    const newMessage: Message = { 
      role: "user", 
      content: userMessage,
      imageUrl: imageData 
    };
    const newMessages: Message[] = [...messages, newMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setIsTyping(true);
    setPendingImage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            petProfiles,
            imageData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка сервера");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";
      let hasStartedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              if (!hasStartedContent) {
                hasStartedContent = true;
                setIsTyping(false);
                setMessages([...newMessages, { role: "assistant", content: "" }]);
              }
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Произошла ошибка. Попробуйте позже.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, petProfiles]);

  const handleSend = () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;
    const message = input.trim() || "Что это за изображение? Порекомендуй подходящие товары.";
    streamChat(message, pendingImage || undefined);
    setInput("");
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setPendingImage(null);
    toast({
      title: "История очищена",
      description: "Чат начат заново",
    });
  };

  const removePendingImage = () => {
    setPendingImage(null);
  };

  // Get products for a message
  const getProductsForMessage = (content: string): Product[] => {
    const ids = parseProductIds(content);
    return ids.map(id => productCache[id]).filter(Boolean);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Chat Button */}
      <button
        data-chat-trigger
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-50 bottom-20 lg:bottom-6 right-4 lg:right-6 flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <div className="relative">
          <Bot className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-primary animate-pulse" />
        </div>
        <span className="font-medium">AI-консультант</span>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed z-50 bottom-0 right-0 lg:bottom-6 lg:right-6 w-full lg:w-[420px] h-[85vh] lg:h-[650px] lg:max-h-[85vh] bg-background rounded-t-3xl lg:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden border border-border/50",
          isOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-full lg:translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">AI-Консультант</h4>
              <p className="text-xs text-muted-foreground">
                {isTyping ? (
                  <span className="text-primary">Печатает...</span>
                ) : isRecording ? (
                  <span className="text-red-500">🎙️ Запись...</span>
                ) : petProfiles.length > 0 ? (
                  `Знаю ваших питомцев 🐾`
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Онлайн
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearHistory} 
                className="rounded-full hover:bg-background/80 h-8 w-8"
                title="Очистить историю"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-background/80">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Привет! 👋</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Я AI-консультант BelBird. Помогу подобрать товары для ваших питомцев, дома и сада.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                📷 Отправьте фото для персональных рекомендаций
              </p>
              {petProfiles.length > 0 && (
                <div className="mt-4 px-3 py-2 rounded-xl bg-primary/10 inline-block">
                  <p className="text-xs text-primary font-medium">
                    ✨ Вижу ваших питомцев — дам персональные рекомендации!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-2.5 animate-fade-in",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 flex-shrink-0 shadow-sm",
                    message.role === "assistant" && "ring-2 ring-primary/20"
                  )}>
                    <AvatarFallback
                      className={cn(
                        "text-xs",
                        message.role === "assistant" 
                          ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground" 
                          : "bg-muted"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[85%] text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                        : "bg-muted/70 rounded-2xl rounded-bl-md border border-border/50"
                    )}
                  >
                    {/* Image preview for user messages */}
                    {message.imageUrl && (
                      <div className="p-2 pb-0">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded" 
                          className="rounded-xl max-h-40 w-auto object-cover"
                        />
                      </div>
                    )}
                    <div className="px-4 py-2.5">
                      {message.role === "assistant" ? (
                        <FormattedMessage 
                          content={message.content} 
                          products={getProductsForMessage(message.content)}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 animate-fade-in">
                  <Avatar className="h-8 w-8 flex-shrink-0 shadow-sm ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/70 rounded-2xl rounded-bl-md border border-border/50">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Pending Image Preview */}
        {pendingImage && (
          <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
            <div className="relative inline-block">
              <img 
                src={pendingImage} 
                alt="Preview" 
                className="h-16 w-auto rounded-lg object-cover border border-border"
              />
              <button
                onClick={removePendingImage}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {messages.length === 0 && !pendingImage && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Быстрые запросы:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.text}
                  onClick={() => {
                    setInput(action.text);
                    streamChat(action.text);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-full bg-accent/50 hover:bg-accent border border-border/50 transition-all hover:scale-105 hover:shadow-sm"
                >
                  <span>{action.icon}</span>
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isCompressing}
              className="rounded-full h-10 w-10 flex-shrink-0"
              title="Прикрепить изображение"
            >
              {isCompressing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={cn(
                "rounded-full h-10 w-10 flex-shrink-0 transition-all",
                isRecording && "animate-pulse"
              )}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={isRecording ? "Говорите..." : pendingImage ? "Добавьте описание..." : "Спросите о товарах..."}
              disabled={isLoading || isRecording}
              className="flex-1 bg-background border-border/50 rounded-full px-4 focus-visible:ring-primary/50"
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={isLoading || (!input.trim() && !pendingImage) || isRecording}
              className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 shadow-sm transition-all hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;
