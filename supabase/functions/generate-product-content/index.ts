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
    const { productName, category, characteristics, tone, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'description') {
      systemPrompt = `Ты — профессиональный копирайтер для премиального зоомагазина BelBird. 
Создавай продающие описания товаров на русском языке.
Тон: ${tone === 'professional' ? 'профессиональный и экспертный' : tone === 'friendly' ? 'дружелюбный и тёплый' : 'премиальный и изысканный'}.
Описание должно быть 3-4 предложения, подчёркивать преимущества и вызывать желание купить.`;
      
      userPrompt = `Создай продающее описание для товара:
Название: ${productName}
Категория: ${category}
Характеристики: ${characteristics}`;
    } else if (type === 'seo') {
      systemPrompt = `Ты — SEO-специалист для премиального зоомагазина BelBird.
Создавай оптимизированные SEO-теги на русском языке.`;
      
      userPrompt = `Создай SEO-теги для товара:
Название: ${productName}
Категория: ${category}
Характеристики: ${characteristics}

Верни JSON в формате:
{
  "title": "SEO title до 60 символов с ключевыми словами | BelBird",
  "description": "Meta description до 160 символов",
  "keywords": "ключевые слова через запятую"
}`;
    } else if (type === 'rich_content') {
      systemPrompt = `Ты — контент-маркетолог для премиального зоомагазина BelBird.
Создавай структурированный рич-контент для карточек товаров на русском языке.
Контент должен быть информативным, продающим и визуально привлекательным.`;
      
      userPrompt = `Создай рич-контент для товара:
Название: ${productName}
Категория: ${category}
Характеристики: ${characteristics}

Верни JSON массив из 3-5 блоков в формате:
[
  {
    "type": "text",
    "title": "Заголовок блока",
    "content": "Подробный текст о преимуществах, особенностях или применении товара. 2-3 предложения."
  },
  {
    "type": "features",
    "title": "Преимущества",
    "items": ["Преимущество 1", "Преимущество 2", "Преимущество 3"]
  },
  {
    "type": "text",
    "title": "Рекомендации по использованию",
    "content": "Советы по применению товара для максимальной пользы."
  }
]

Типы блоков: text (заголовок + текст), features (список преимуществ), image (placeholder для изображения).
Создавай уникальный контент, подходящий именно для этого товара.`;
    }

    console.log('Generating content for:', productName, 'type:', type);

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
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

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
