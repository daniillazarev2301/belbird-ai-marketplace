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
    const { messages, petProfiles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const systemPrompt = `Ты - AI-консультант премиального зоомагазина BelBird. Твоя задача - помогать покупателям выбирать товары для их питомцев, дома и сада.

Ключевые принципы:
- Будь дружелюбным и профессиональным
- Давай персонализированные рекомендации на основе информации о питомцах пользователя
- Учитывай породу, возраст, вес и особые потребности при рекомендациях
- Предлагай премиальные товары высокого качества
- Объясняй, почему конкретный товар подходит именно этому питомцу
- Отвечай кратко и по существу, но информативно
- Используй эмодзи умеренно для дружелюбности
${petContext}

Категории товаров BelBird:
1. Питомцы - корма, лакомства, игрушки, лежанки, переноски, гигиена, витамины
2. Дом - декор, текстиль, эко-уборка, кухонные принадлежности
3. Сад - семена, рассада, инструменты, удобрения

Бренды: Royal Canin, Purina, Trixie, FURminator, Bio-Groom и другие премиальные бренды.`;

    console.log("Calling Lovable AI with pet context:", petContext);

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
          ...messages,
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
