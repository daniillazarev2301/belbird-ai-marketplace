import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, petProfiles, imageData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build context about user's pets
    let petContext = "";
    if (petProfiles && petProfiles.length > 0) {
      petContext = `\n\nИнформация о питомцах пользователя:\n`;
      petProfiles.forEach((pet: any, index: number) => {
        petContext += `${index + 1}. ${pet.name} - ${pet.species}`;
        if (pet.breed) petContext += `, порода: ${pet.breed}`;
        if (pet.age_years) petContext += `, возраст: ${pet.age_years} лет`;
        if (pet.weight_kg) petContext += `, вес: ${pet.weight_kg} кг`;
        if (pet.allergies && pet.allergies.length > 0) petContext += `, аллергии: ${pet.allergies.join(", ")}`;
        if (pet.special_needs) petContext += `, особые потребности: ${pet.special_needs}`;
        petContext += "\n";
      });
    }

    // Fetch some products for context
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, old_price, images, category_id, description')
      .eq('is_active', true)
      .limit(50);

    const productList = products?.map(p => `- ${p.name} (ID: ${p.id}, цена: ${p.price}₽)`).join('\n') || '';

    const systemPrompt = `Ты - AI-консультант премиального зоомагазина BelBird. Твоя задача - помогать покупателям выбирать товары для их питомцев, дома и сада.

Ключевые принципы:
- Будь дружелюбным и профессиональным
- Давай персонализированные рекомендации на основе информации о питомцах пользователя
- Учитывай породу, возраст, вес и особые потребности при рекомендациях
- Предлагай премиальные товары высокого качества
- Объясняй, почему конкретный товар подходит именно этому питомцу
- Отвечай кратко и по существу, но информативно
- Используй эмодзи умеренно для дружелюбности
- Если пользователь отправил изображение, проанализируй его и дай рекомендации
${petContext}

ВАЖНО - ФОРМАТ РЕКОМЕНДАЦИЙ ТОВАРОВ:
Когда рекомендуешь конкретные товары, ОБЯЗАТЕЛЬНО используй следующий формат для каждого товара:
[PRODUCT:ID_ТОВАРА]

Например: "Рекомендую корм Royal Canin [PRODUCT:abc123-def456]"

Это позволит показать карточку товара прямо в чате.

Доступные товары в каталоге:
${productList}

Категории товаров BelBird:
1. Питомцы - корма, лакомства, игрушки, лежанки, переноски, гигиена, витамины
2. Дом - декор, текстиль, эко-уборка, кухонные принадлежности
3. Сад - семена, рассада, инструменты, удобрения

При анализе изображений:
- Определи, что изображено (питомец, товар, проблема)
- Если это питомец - определи вид, возможную породу, примерный возраст
- Дай конкретные рекомендации по товарам из каталога с использованием формата [PRODUCT:ID]`;

    console.log("Calling Lovable AI with pet context:", petContext);
    console.log("Has image data:", !!imageData);

    // Build messages array with potential image content
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === "user" && imageData && msg === messages[messages.length - 1]) {
        return {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            },
            {
              type: "text",
              text: msg.content || "Проанализируй это изображение и дай рекомендации по товарам"
            }
          ]
        };
      }
      return msg;
    });

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
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов. Попробуйте позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Лимит AI-запросов исчерпан." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Ошибка AI-сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
