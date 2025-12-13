import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Mic, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
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

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [petProfiles, setPetProfiles] = useState<PetProfile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    "Корм для моего питомца",
    "Рекомендации по уходу",
    "Что сейчас в тренде?",
  ];

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
  }, [messages]);

  const streamChat = useCallback(async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

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
            messages: newMessages,
            petProfiles,
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

      setMessages([...newMessages, { role: "assistant", content: "" }]);

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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Произошла ошибка. Попробуйте позже.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, petProfiles]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Chat Button */}
      <button
        data-chat-trigger
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-50 bottom-20 lg:bottom-6 right-4 lg:right-6 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-medium">AI-консультант</span>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed z-50 bottom-0 right-0 lg:bottom-6 lg:right-6 w-full lg:w-96 h-[80vh] lg:h-[600px] lg:max-h-[80vh] bg-background rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
          isOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-full lg:translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold">AI-Консультант</h4>
              <p className="text-xs text-muted-foreground">
                {petProfiles.length > 0 ? `Знаю ваших питомцев 🐾` : "Онлайн"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/30" />
              <p className="font-medium mb-2">Привет! 👋</p>
              <p className="text-sm text-muted-foreground">
                Я AI-консультант BelBird. Помогу подобрать товары для ваших питомцев, дома и сада.
              </p>
              {petProfiles.length > 0 && (
                <p className="text-xs mt-4 text-primary">
                  Вижу ваших питомцев и дам персональные рекомендации!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback
                      className={message.role === "assistant" ? "bg-primary text-primary-foreground" : ""}
                    >
                      {message.role === "assistant" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    {message.content || <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Быстрые запросы:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setInput(action);
                    streamChat(action);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent hover:bg-accent/80 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Спросите о товарах..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;
