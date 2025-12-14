import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ===========================================
// Генерация блог-контента для YandexGPT
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
        modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt`,  // Полная модель для статей
        completionOptions: {
          stream: false,
          temperature: 0.7,
          maxTokens: "8000"  // Больше для статей
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
    const { title, category, keywords, type, existingContent } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'full_article') {
      systemPrompt = `Ты — профессиональный копирайтер для премиального зоомагазина BelBird. 
Создавай качественные статьи на русском языке для блога.
Статьи должны быть информативными и SEO-оптимизированными для Яндекса.
Используй подзаголовки (##), списки и абзацы.
Длина статьи: 800-1200 слов.`;
      
      userPrompt = `Напиши статью для блога:
Заголовок: ${title}
Категория: ${category || 'Общее'}
Ключевые слова: ${keywords || 'не указаны'}

Структура:
1. Введение
2. Основная часть (3-4 раздела)
3. Практические советы
4. Заключение`;

    } else if (type === 'excerpt') {
      systemPrompt = `Ты — копирайтер для премиального зоомагазина BelBird.
Создавай краткие описания для анонсов статей.`;
      
      userPrompt = `Создай краткое описание для статьи:
Заголовок: ${title}
${existingContent ? `Содержание: ${existingContent.substring(0, 500)}...` : ''}

Длина: 150-200 символов`;

    } else if (type === 'seo') {
      systemPrompt = `Ты — SEO-специалист для премиального зоомагазина BelBird.
Создавай оптимизированные SEO-теги для Яндекса.`;
      
      userPrompt = `Создай SEO-теги для статьи:
Заголовок: ${title}
Категория: ${category || 'Общее'}

Верни JSON:
{
  "metaTitle": "SEO title до 60 символов | BelBird",
  "metaDescription": "Meta description до 160 символов",
  "tags": ["тег1", "тег2", "тег3", "тег4", "тег5"]
}`;

    } else if (type === 'improve') {
      systemPrompt = `Ты — редактор для премиального зоомагазина BelBird.
Улучшай тексты: делай читабельнее, структурированнее и SEO-оптимизированнее.`;
      
      userPrompt = `Улучши эту статью:

${existingContent}

Сохрани основную мысль, улучши структуру, добавь подзаголовки.`;
    }

    console.log('Generating blog content:', { title, type });

    const generatedContent = await callYandexGPT(systemPrompt, userPrompt);

    console.log('Generated blog content successfully');

    return new Response(JSON.stringify({ 
      content: generatedContent,
      type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
