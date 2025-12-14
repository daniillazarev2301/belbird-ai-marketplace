import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ===========================================
// Генерация контента продуктов для YandexGPT
// ===========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callYandexGPT(systemPrompt: string, userPrompt: string): Promise<string> {
  const YANDEX_API_KEY = Deno.env.get("YANDEX_API_KEY");
  const YANDEX_FOLDER_ID = Deno.env.get("YANDEX_FOLDER_ID");
  
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    throw new Error("YandexGPT credentials not configured");
  }
  
  const response = await fetch(
    "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
    {
      method: "POST",
      headers: {
        "Authorization": `Api-Key ${YANDEX_API_KEY}`,
        "Content-Type": "application/json",
        "x-folder-id": YANDEX_FOLDER_ID
      },
      body: JSON.stringify({
        modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.7,
          maxTokens: "2000"
        },
        messages: [
          { role: "system", text: systemPrompt },
          { role: "user", text: userPrompt }
        ]
      })
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category, characteristics, tone, type } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'description') {
      systemPrompt = `Ты — профессиональный копирайтер для премиального зоомагазина BelBird. 
Создавай продающие описания товаров на русском языке.
Тон: ${tone === 'professional' ? 'профессиональный и экспертный' : tone === 'friendly' ? 'дружелюбный и тёплый' : 'премиальный и изысканный'}.
Описание должно быть 3-4 предложения.`;
      
      userPrompt = `Создай описание для товара:
Название: ${productName}
Категория: ${category}
Характеристики: ${characteristics}`;

    } else if (type === 'seo') {
      systemPrompt = `Ты — SEO-специалист для премиального зоомагазина BelBird.
Создавай оптимизированные SEO-теги на русском языке.`;
      
      userPrompt = `Создай SEO-теги для товара:
Название: ${productName}
Категория: ${category}

Верни JSON:
{
  "title": "SEO title до 60 символов | BelBird",
  "description": "Meta description до 160 символов",
  "keywords": "ключевые слова через запятую"
}`;

    } else if (type === 'rich_content') {
      systemPrompt = `Ты — контент-маркетолог для премиального зоомагазина BelBird.
Создавай структурированный рич-контент для карточек товаров.`;
      
      userPrompt = `Создай рич-контент для товара:
Название: ${productName}
Категория: ${category}
Характеристики: ${characteristics}

Верни JSON массив из 3-5 блоков:
[
  {"type": "text", "title": "Заголовок", "content": "Текст"},
  {"type": "features", "title": "Преимущества", "items": ["1", "2", "3"]}
]`;
    }

    console.log('Generating content for:', productName, 'type:', type);

    const generatedContent = await callYandexGPT(systemPrompt, userPrompt);

    console.log('Generated content:', generatedContent);

    return new Response(JSON.stringify({ 
      content: generatedContent,
      type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-product-content:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
