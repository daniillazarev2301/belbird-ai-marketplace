import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

interface RateLimitState {
  minuteCount: number;
  minuteReset: number;
  dayCount: number;
  dayReset: number;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private rateLimitState: RateLimitState = {
    minuteCount: 0,
    minuteReset: Date.now() + 60000,
    dayCount: 0,
    dayReset: Date.now() + 86400000,
  };

  constructor() {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  private checkRateLimit(): void {
    const now = Date.now();

    // Reset minute counter
    if (now > this.rateLimitState.minuteReset) {
      this.rateLimitState.minuteCount = 0;
      this.rateLimitState.minuteReset = now + 60000;
    }

    // Reset day counter
    if (now > this.rateLimitState.dayReset) {
      this.rateLimitState.dayCount = 0;
      this.rateLimitState.dayReset = now + 86400000;
    }

    // Check limits
    if (this.rateLimitState.minuteCount >= config.aiRateLimitPerMinute) {
      throw new Error('AI rate limit exceeded (per minute). Please wait.');
    }

    if (this.rateLimitState.dayCount >= config.aiRateLimitPerDay) {
      throw new Error('AI rate limit exceeded (per day). Please try tomorrow.');
    }

    // Increment counters
    this.rateLimitState.minuteCount++;
    this.rateLimitState.dayCount++;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('AI service not configured. Set GEMINI_API_KEY.');
    }

    this.checkRateLimit();

    const model = this.genAI.getGenerativeModel({ model: config.geminiModel });
    
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  async generateProductDescription(productName: string, category?: string): Promise<string> {
    const systemPrompt = `Ты — опытный копирайтер интернет-магазина BelBird.
Пиши на русском языке. Создавай привлекательные, SEO-оптимизированные описания товаров.
Описание должно быть информативным, выделять преимущества товара и побуждать к покупке.
Длина: 150-300 слов.`;

    const prompt = `Создай описание для товара: "${productName}"${category ? ` из категории "${category}"` : ''}.`;

    return this.generateText(prompt, systemPrompt);
  }

  async generateChatResponse(
    message: string,
    context?: { products?: any[]; history?: { role: string; content: string }[] }
  ): Promise<string> {
    const systemPrompt = `Ты — AI-ассистент интернет-магазина BelBird.
Помогаешь покупателям найти товары для домашних питомцев, дома и сада.
Отвечай дружелюбно, кратко и по делу.
Если не знаешь ответа — честно скажи об этом.
Всегда старайся предложить конкретные товары из каталога.`;

    let prompt = message;
    
    if (context?.history && context.history.length > 0) {
      const historyText = context.history
        .slice(-5) // Last 5 messages for context
        .map(m => `${m.role === 'user' ? 'Покупатель' : 'Ассистент'}: ${m.content}`)
        .join('\n');
      prompt = `История диалога:\n${historyText}\n\nПокупатель: ${message}`;
    }

    if (context?.products && context.products.length > 0) {
      const productsText = context.products
        .slice(0, 5)
        .map(p => `- ${p.name} (${p.price} ₽)`)
        .join('\n');
      prompt += `\n\nРелевантные товары из каталога:\n${productsText}`;
    }

    return this.generateText(prompt, systemPrompt);
  }

  async generateBlogPost(topic: string, keywords?: string[]): Promise<{
    title: string;
    excerpt: string;
    content: string;
  }> {
    const systemPrompt = `Ты — контент-менеджер интернет-магазина BelBird.
Создаёшь полезные статьи для блога на темы ухода за питомцами, домом и садом.
Статьи должны быть SEO-оптимизированы, информативны и полезны для читателей.
Формат ответа — JSON:
{
  "title": "Заголовок статьи",
  "excerpt": "Краткое описание (1-2 предложения)",
  "content": "Полный текст статьи в формате Markdown"
}`;

    const prompt = `Напиши статью для блога на тему: "${topic}"${
      keywords ? `\nКлючевые слова для SEO: ${keywords.join(', ')}` : ''
    }`;

    const response = await this.generateText(prompt, systemPrompt);
    
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback if not valid JSON
    }

    return {
      title: topic,
      excerpt: response.slice(0, 200),
      content: response,
    };
  }

  async generateReviews(
    productName: string,
    count: number = 3,
    options?: {
      minRating?: number;
      maxRating?: number;
      tone?: 'positive' | 'mixed' | 'critical';
    }
  ): Promise<{ rating: number; title: string; content: string; pros?: string; cons?: string }[]> {
    const { minRating = 3, maxRating = 5, tone = 'positive' } = options || {};

    const systemPrompt = `Ты генерируешь реалистичные отзывы покупателей для товара.
Отзывы должны выглядеть естественно, как написанные реальными людьми.
Используй разговорный русский язык.
Тон отзывов: ${tone === 'positive' ? 'в основном положительный' : tone === 'critical' ? 'критический, но конструктивный' : 'смешанный'}.
Формат ответа — JSON массив:
[
  {
    "rating": 5,
    "title": "Краткий заголовок",
    "content": "Текст отзыва",
    "pros": "Достоинства",
    "cons": "Недостатки (может быть пустым)"
  }
]`;

    const prompt = `Сгенерируй ${count} отзывов для товара "${productName}".
Рейтинг от ${minRating} до ${maxRating}.`;

    const response = await this.generateText(prompt, systemPrompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }

    return [{
      rating: 5,
      title: 'Отличный товар',
      content: 'Рекомендую к покупке!',
    }];
  }

  getRateLimitStatus(): {
    minuteRemaining: number;
    dayRemaining: number;
    minuteResetIn: number;
    dayResetIn: number;
  } {
    const now = Date.now();
    return {
      minuteRemaining: Math.max(0, config.aiRateLimitPerMinute - this.rateLimitState.minuteCount),
      dayRemaining: Math.max(0, config.aiRateLimitPerDay - this.rateLimitState.dayCount),
      minuteResetIn: Math.max(0, this.rateLimitState.minuteReset - now),
      dayResetIn: Math.max(0, this.rateLimitState.dayReset - now),
    };
  }
}

export const aiService = new AIService();
