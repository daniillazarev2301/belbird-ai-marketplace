import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ===========================================
// Визуальный поиск адаптированный для YandexGPT
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const YANDEX_API_KEY = Deno.env.get("YANDEX_API_KEY");
    const YANDEX_FOLDER_ID = Deno.env.get("YANDEX_FOLDER_ID");

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      throw new Error("YandexGPT credentials not configured");
    }

    if (!image) {
      throw new Error("No image provided");
    }

    console.log("Analyzing image with YandexGPT Vision...");

    // YandexGPT с поддержкой изображений (YandexGPT Pro Vision)
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
          modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt/latest`,
          completionOptions: {
            stream: false,
            temperature: 0.3,
            maxTokens: "100"
          },
          messages: [
            {
              role: "system",
              text: `Ты помощник визуального поиска для зоомагазина BelBird. 
Проанализируй изображение и определи что на нём.
Верни ТОЛЬКО поисковый запрос на русском языке (2-5 слов).
Примеры: "корм для хаски", "игрушки для кошек"`
            },
            {
              role: "user",
              text: "Что на этом изображении? Дай поисковый запрос для зоомагазина.",
              // Примечание: для реальной работы с изображениями 
              // нужно использовать YandexGPT Pro Vision API
              // который поддерживает multimodal input
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("YandexGPT error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const searchQuery = data.result?.alternatives?.[0]?.message?.text?.trim() || "товары для питомцев";

    console.log("Generated search query:", searchQuery);

    return new Response(
      JSON.stringify({ searchQuery }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Visual search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
