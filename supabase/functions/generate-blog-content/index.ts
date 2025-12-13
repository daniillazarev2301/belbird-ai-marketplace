import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, keywords, type, existingContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'full_article') {
      systemPrompt = `Ты — профессиональный копирайтер для премиального зоомагазина BelBird. 
Создавай качественные статьи на русском языке для блога о домашних животных, доме и саде.
Статьи должны быть информативными, полезными и SEO-оптимизированными для Яндекса.
Используй подзаголовки (##), списки и абзацы для структурирования.
Длина статьи: 800-1200 слов.`;
      
      userPrompt = `Напиши полную статью для блога:
Заголовок: ${title}
Категория: ${category || 'Общее'}
Ключевые слова: ${keywords || 'не указаны'}

Структура статьи:
1. Введение (привлеки внимание читателя)
2. Основная часть (3-4 раздела с подзаголовками)
3. Практические советы
4. Заключение с призывом к действию`;

    } else if (type === 'excerpt') {
      systemPrompt = `Ты — копирайтер для премиального зоомагазина BelBird.
Создавай краткие, цепляющие описания для анонсов статей блога.`;
      
      userPrompt = `Создай краткое описание (excerpt) для статьи:
Заголовок: ${title}
${existingContent ? `Содержание статьи: ${existingContent.substring(0, 500)}...` : ''}

Требования:
- Длина: 150-200 символов
- Должно заинтересовать читателя
- Содержать ключевую мысль статьи`;

    } else if (type === 'seo') {
      systemPrompt = `Ты — SEO-специалист для премиального зоомагазина BelBird.
Создавай оптимизированные SEO-теги на русском языке для Яндекса.`;
      
      userPrompt = `Создай SEO-теги для статьи блога:
Заголовок: ${title}
Категория: ${category || 'Общее'}
${existingContent ? `Краткое содержание: ${existingContent.substring(0, 300)}...` : ''}

Верни JSON в формате:
{
  "metaTitle": "SEO title до 60 символов с ключевыми словами | BelBird",
  "metaDescription": "Meta description до 160 символов для Яндекса",
  "tags": ["тег1", "тег2", "тег3", "тег4", "тег5"]
}`;

    } else if (type === 'improve') {
      systemPrompt = `Ты — редактор для премиального зоомагазина BelBird.
Улучшай тексты статей: делай их более читабельными, структурированными и SEO-оптимизированными.`;
      
      userPrompt = `Улучши и отредактируй эту статью:

${existingContent}

Требования:
- Сохрани основную мысль
- Улучши структуру
- Добавь подзаголовки если их нет
- Сделай текст более читабельным
- Оптимизируй для SEO`;
    }

    console.log('Generating blog content:', { title, type });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Превышен лимит запросов. Попробуйте позже.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Недостаточно кредитов AI. Пополните баланс.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

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
