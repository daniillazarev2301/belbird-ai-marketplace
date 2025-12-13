import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, User, Bot } from "lucide-react";
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

// Format message content with markdown-like styling
const FormattedMessage = ({ content }: { content: string }) => {
  // Split by code blocks, lists, and headers
  const formatContent = (text: string) => {
    // Simple formatting for common patterns
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <p key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</p>;
      }
      if (line.startsWith('## ')) {
        return <p key={i} className="font-semibold mt-2 mb-1">{line.slice(3)}</p>;
      }
      
      // List items
      if (line.match(/^[-•*]\s/)) {
        return (
          <div key={i} className="flex gap-2 ml-1">
            <span className="text-primary">•</span>
            <span>{formatInlineText(line.slice(2))}</span>
          </div>
        );
      }
      
      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1];
        return (
          <div key={i} className="flex gap-2 ml-1">
            <span className="text-primary font-medium min-w-[1.2rem]">{num}.</span>
            <span>{formatInlineText(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      
      // Empty lines
      if (!line.trim()) {
        return <div key={i} className="h-2" />;
      }
      
      // Regular text
      return <p key={i}>{formatInlineText(line)}</p>;
    });
  };
  
  // Handle bold and inline formatting
  const formatInlineText = (text: string) => {
    // Bold text **text** or __text__
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

  return <div className="space-y-0.5">{formatContent(content)}</div>;
};

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [petProfiles, setPetProfiles] = useState<PetProfile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { icon: "🐾", text: "Корм для питомца" },
    { icon: "💡", text: "Рекомендации по уходу" },
    { icon: "🔥", text: "Что в тренде?" },
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
  }, [messages, isTyping]);

  const streamChat = useCallback(async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setIsTyping(true);

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
          "fixed z-50 bottom-0 right-0 lg:bottom-6 lg:right-6 w-full lg:w-[400px] h-[85vh] lg:h-[600px] lg:max-h-[80vh] bg-background rounded-t-3xl lg:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden border border-border/50",
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
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-background/80">
            <X className="h-5 w-5" />
          </Button>
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
                      "max-w-[80%] px-4 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                        : "bg-muted/70 rounded-2xl rounded-bl-md border border-border/50"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <FormattedMessage content={message.content} />
                    ) : (
                      message.content
                    )}
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

        {/* Quick Actions */}
        {messages.length === 0 && (
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
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Спросите о товарах..."
              disabled={isLoading}
              className="flex-1 bg-background border-border/50 rounded-full px-4 focus-visible:ring-primary/50"
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={isLoading || !input.trim()}
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
