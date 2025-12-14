import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===========================================
// Генерация отзывов для YandexGPT
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callYandexGPT(prompt: string): Promise<string> {
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
          temperature: 0.8,
          maxTokens: "4000"
        },
        messages: [
          { 
            role: "system", 
            text: "Ты эксперт по созданию реалистичных отзывов на товары. Отвечай только валидным JSON." 
          },
          { role: "user", text: prompt }
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      productId, 
      productName, 
      count = 5, 
      minRating = 3, 
      maxRating = 5, 
      tone = "mixed",
      detailLevel = "medium"
    } = await req.json();

    if (!productId || !productName) {
      return new Response(
        JSON.stringify({ error: "Product ID and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating ${count} reviews for: ${productName}`);

    const toneDescriptions: Record<string, string> = {
      positive: "только положительные",
      mixed: "смешанные (с небольшими замечаниями)",
      critical: "с конструктивной критикой",
      enthusiastic: "очень восторженные"
    };

    const detailDescriptions: Record<string, string> = {
      short: "краткие, 1-2 предложения",
      medium: "средние, 3-5 предложений",
      detailed: "развёрнутые, 6+ предложений"
    };

    const prompt = `Сгенерируй ${count} реалистичных отзывов на русском языке для товара "${productName}".

Требования:
- Рейтинги от ${minRating} до ${maxRating} звёзд
- Тональность: ${toneDescriptions[tone] || toneDescriptions.mixed}
- Длина: ${detailDescriptions[detailLevel] || detailDescriptions.medium}
- Живой разговорный русский язык

Верни JSON:
{
  "reviews": [
    {
      "rating": 5,
      "title": "Заголовок (3-7 слов)",
      "content": "Текст отзыва",
      "pros": "Что понравилось",
      "cons": "Что не понравилось (null если рейтинг 5)"
    }
  ]
}`;

    const content = await callYandexGPT(prompt);
    console.log("YandexGPT response:", content);

    // Парсим JSON
    let reviews;
    try {
      const parsed = JSON.parse(content);
      reviews = parsed.reviews || parsed;
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        reviews = parsed.reviews || parsed;
      } else {
        throw new Error("Failed to parse response");
      }
    }

    // Сохраняем в БД
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemUserId = "00000000-0000-0000-0000-000000000000";

    const reviewsToInsert = reviews.map((review: any) => ({
      product_id: productId,
      user_id: systemUserId,
      rating: review.rating,
      title: review.title,
      content: review.content,
      pros: review.pros || null,
      cons: review.cons || null,
      is_approved: true,
      is_verified_purchase: false,
    }));

    const { data: insertedReviews, error: insertError } = await supabase
      .from("reviews")
      .insert(reviewsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to insert reviews");
    }

    // Обновляем рейтинг товара
    const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
    
    const { data: currentProduct } = await supabase
      .from("products")
      .select("review_count, rating")
      .eq("id", productId)
      .single();

    const currentCount = currentProduct?.review_count || 0;
    const currentRating = currentProduct?.rating || 0;
    const newCount = currentCount + reviews.length;
    const newRating = currentCount > 0 
      ? ((currentRating * currentCount) + (avgRating * reviews.length)) / newCount
      : avgRating;

    await supabase
      .from("products")
      .update({ 
        review_count: newCount, 
        rating: Math.round(newRating * 10) / 10 
      })
      .eq("id", productId);

    console.log(`Successfully created ${reviews.length} reviews`);

    return new Response(
      JSON.stringify({ success: true, count: reviews.length, reviews: insertedReviews }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating reviews:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
