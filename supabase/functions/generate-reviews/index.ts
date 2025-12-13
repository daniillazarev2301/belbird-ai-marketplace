import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating ${count} reviews for product: ${productName} (rating: ${minRating}-${maxRating}, tone: ${tone}, detail: ${detailLevel})`);

    // Build tone description
    const toneDescriptions: Record<string, string> = {
      positive: "только положительные, довольные покупкой",
      mixed: "смешанные (большинство положительных, но с небольшими замечаниями для реалистичности)",
      critical: "с конструктивной критикой, указанием на реальные недостатки",
      enthusiastic: "очень восторженные, эмоциональные, с восклицаниями"
    };

    // Build detail level description
    const detailDescriptions: Record<string, string> = {
      short: "краткие, 1-2 предложения, без лишних деталей",
      medium: "средней длины, 3-5 предложений с конкретными деталями",
      detailed: "развёрнутые, 6+ предложений с подробным описанием опыта использования"
    };

    const prompt = `Сгенерируй ${count} реалистичных отзывов на русском языке для товара "${productName}".

Требования:
- Рейтинги строго от ${minRating} до ${maxRating} звёзд (распределить равномерно)
- Тональность отзывов: ${toneDescriptions[tone] || toneDescriptions.mixed}
- Длина отзывов: ${detailDescriptions[detailLevel] || detailDescriptions.medium}
- Используй живой разговорный русский язык
- Добавь конкретные детали про использование товара
- Каждый отзыв должен быть уникальным по стилю
- Имитируй разных покупателей (молодые, пожилые, опытные, новички)

Верни JSON массив объектов со структурой:
{
  "reviews": [
    {
      "rating": 5,
      "title": "Заголовок отзыва (краткий, 3-7 слов)",
      "content": "Основной текст отзыва",
      "pros": "Что понравилось (1-3 пункта через запятую)",
      "cons": "Что не понравилось (может быть null если рейтинг 5)"
    }
  ]
}

Отвечай ТОЛЬКО валидным JSON без markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ты эксперт по созданию реалистичных отзывов на товары для интернет-магазина. Отвечай только валидным JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse JSON from response
    let reviews;
    try {
      const parsed = JSON.parse(content);
      reviews = parsed.reviews || parsed;
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        reviews = parsed.reviews || parsed;
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a fake user ID for AI reviews (or use a system user)
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    // Insert reviews into database
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
      return new Response(
        JSON.stringify({ error: "Failed to insert reviews", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update product review_count and rating
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

    console.log(`Successfully created ${reviews.length} reviews for product ${productId}`);

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
