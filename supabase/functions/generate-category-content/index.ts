import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoryName, currentDescription, type } = await req.json();

    if (!categoryName) {
      return new Response(
        JSON.stringify({ error: "Category name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (type === "description") {
      systemPrompt = `Ты — опытный копирайтер для интернет-магазина товаров для домашних питомцев, дома и сада BelBird. 
Твоя задача — создавать привлекательные и информативные описания категорий товаров.
Пиши на русском языке. Описание должно быть 2-4 предложения, информативным и привлекательным для покупателей.
Подчеркивай качество товаров, удобство покупки и экспертизу магазина.`;

      userPrompt = `Напиши привлекательное описание для категории товаров "${categoryName}" в интернет-магазине BelBird.
${currentDescription ? `Текущее описание для улучшения: ${currentDescription}` : ""}
Описание должно быть 2-4 предложения, информативным и мотивирующим к покупке.`;
    } else {
      systemPrompt = `Ты — SEO-специалист для интернет-магазина товаров для домашних питомцев, дома и сада BelBird.
Твоя задача — создавать оптимизированные SEO-теги для категорий товаров.
Все тексты должны быть на русском языке и оптимизированы для поисковых систем Яндекс и Google.`;

      userPrompt = `Создай SEO-теги для категории "${categoryName}" в интернет-магазине BelBird.

Ответь строго в формате JSON:
{
  "metaTitle": "SEO заголовок до 60 символов с ключевыми словами",
  "metaDescription": "SEO описание до 160 символов с призывом к действию",
  "metaKeywords": "ключевые слова через запятую, 5-10 штук"
}

Включи название магазина BelBird и релевантные ключевые слова.`;
    }

    console.log(`Generating ${type} for category: ${categoryName}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Недостаточно кредитов для AI-генерации." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", content);

    if (type === "description") {
      return new Response(
        JSON.stringify({ description: content.trim() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Parse JSON response for SEO
      try {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const seoData = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify(seoData),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error("Invalid JSON response");
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Return raw content as fallback
        return new Response(
          JSON.stringify({
            metaTitle: categoryName + " — купить в BelBird",
            metaDescription: `${categoryName} в интернет-магазине BelBird. Широкий выбор, доступные цены, быстрая доставка.`,
            metaKeywords: categoryName.toLowerCase(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error: unknown) {
    console.error("Error in generate-category-content:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
