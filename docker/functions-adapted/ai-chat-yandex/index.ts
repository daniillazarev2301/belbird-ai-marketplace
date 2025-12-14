import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// ===========================================
// AI Chat адаптированный для YandexGPT
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Поддерживаемые провайдеры
type AIProvider = 'yandexgpt' | 'gigachat' | 'openai' | 'openrouter';

interface YandexGPTMessage {
  role: 'system' | 'user' | 'assistant';
  text: string;
}

interface YandexGPTRequest {
  modelUri: string;
  completionOptions: {
    stream: boolean;
    temperature: number;
    maxTokens: string;
  };
  messages: YandexGPTMessage[];
}

// Конвертация OpenAI формата в YandexGPT
function convertToYandexMessages(messages: any[]): YandexGPTMessage[] {
  return messages.map(msg => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    text: typeof msg.content === 'string' 
      ? msg.content 
      : msg.content.map((c: any) => c.text || '').join('\n')
  }));
}

// Вызов YandexGPT API
async function callYandexGPT(messages: any[], systemPrompt: string): Promise<string> {
  const YANDEX_API_KEY = Deno.env.get("YANDEX_API_KEY");
  const YANDEX_FOLDER_ID = Deno.env.get("YANDEX_FOLDER_ID");
  
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    throw new Error("YandexGPT credentials not configured");
  }
  
  const allMessages: YandexGPTMessage[] = [
    { role: 'system', text: systemPrompt },
    ...convertToYandexMessages(messages)
  ];
  
  const body: YandexGPTRequest = {
    modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
    completionOptions: {
      stream: false,
      temperature: 0.6,
      maxTokens: "2000"
    },
    messages: allMessages
  };
  
  console.log("Calling YandexGPT...");
  
  const response = await fetch(
    "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
    {
      method: "POST",
      headers: {
        "Authorization": `Api-Key ${YANDEX_API_KEY}`,
        "Content-Type": "application/json",
        "x-folder-id": YANDEX_FOLDER_ID
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("YandexGPT error:", response.status, errorText);
    throw new Error(`YandexGPT error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.result?.alternatives?.[0]?.message?.text || "";
}

// Вызов GigaChat API (Сбер)
async function callGigaChat(messages: any[], systemPrompt: string): Promise<string> {
  const GIGACHAT_TOKEN = Deno.env.get("GIGACHAT_TOKEN");
  
  if (!GIGACHAT_TOKEN) {
    throw new Error("GigaChat token not configured");
  }
  
  // Получаем access token
  const authResponse = await fetch(
    "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "RqUID": crypto.randomUUID(),
        "Authorization": `Basic ${GIGACHAT_TOKEN}`
      },
      body: "scope=GIGACHAT_API_PERS"
    }
  );
  
  if (!authResponse.ok) {
    throw new Error("GigaChat auth failed");
  }
  
  const authData = await authResponse.json();
  const accessToken = authData.access_token;
  
  // Делаем запрос к API
  const response = await fetch(
    "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "GigaChat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`GigaChat error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Вызов OpenAI API (через прокси если нужно)
async function callOpenAI(messages: any[], systemPrompt: string): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const OPENAI_BASE_URL = Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Вызов OpenRouter (агрегатор моделей)
async function callOpenRouter(messages: any[], systemPrompt: string): Promise<string> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://belbird.ru",
      "X-Title": "BelBird AI Chat"
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Определяем провайдера
function getProvider(): AIProvider {
  const provider = Deno.env.get("AI_PROVIDER") || "yandexgpt";
  return provider.toLowerCase() as AIProvider;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, petProfiles } = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Контекст питомцев
    let petContext = "";
    if (petProfiles && petProfiles.length > 0) {
      petContext = `\n\nИнформация о питомцах пользователя:\n`;
      petProfiles.forEach((pet: any, index: number) => {
        petContext += `${index + 1}. ${pet.name} - ${pet.species}`;
        if (pet.breed) petContext += `, порода: ${pet.breed}`;
        if (pet.age_years) petContext += `, возраст: ${pet.age_years} лет`;
        if (pet.weight_kg) petContext += `, вес: ${pet.weight_kg} кг`;
        petContext += "\n";
      });
    }

    // Получаем товары
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, description')
      .eq('is_active', true)
      .limit(30);

    const productList = products?.map(p => `- ${p.name} (ID: ${p.id}, цена: ${p.price}₽)`).join('\n') || '';

    const systemPrompt = `Ты - AI-консультант премиального зоомагазина BelBird. 
Помогай покупателям выбирать товары для их питомцев, дома и сада.
${petContext}

Формат рекомендаций товаров: [PRODUCT:ID_ТОВАРА]

Доступные товары:
${productList}

Категории: Питомцы (корма, игрушки, гигиена), Дом (декор, текстиль), Сад (семена, инструменты)`;

    console.log(`Using AI provider: ${getProvider()}`);

    let response: string;
    const provider = getProvider();
    
    switch (provider) {
      case 'yandexgpt':
        response = await callYandexGPT(messages, systemPrompt);
        break;
      case 'gigachat':
        response = await callGigaChat(messages, systemPrompt);
        break;
      case 'openai':
        response = await callOpenAI(messages, systemPrompt);
        break;
      case 'openrouter':
        response = await callOpenRouter(messages, systemPrompt);
        break;
      default:
        response = await callYandexGPT(messages, systemPrompt);
    }

    return new Response(
      JSON.stringify({ 
        choices: [{ 
          message: { 
            role: "assistant", 
            content: response 
          } 
        }] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
