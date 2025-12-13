import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalculateRequest {
  provider: string;
  fromCity: string;
  toCity: string;
  weight?: number; // kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue?: number;
}

interface DeliverySettings {
  cdek_enabled: boolean;
  cdek_account: string;
  cdek_password: string;
  cdek_test_mode: boolean;
  boxberry_enabled: boolean;
  boxberry_token: string;
  boxberry_test_mode: boolean;
  russian_post_enabled: boolean;
  russian_post_token: string;
  russian_post_login: string;
  russian_post_password: string;
  russian_post_test_mode: boolean;
}

// Get delivery settings from database
async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "delivery_providers")
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching delivery settings:", error);
    return null;
  }
  
  return data?.value as DeliverySettings | null;
}

// CDEK API
async function calculateCdek(settings: DeliverySettings, request: CalculateRequest) {
  const baseUrl = settings.cdek_test_mode 
    ? "https://api.edu.cdek.ru/v2"
    : "https://api.cdek.ru/v2";

  // Get auth token
  const authResponse = await fetch(`${baseUrl}/oauth/token?parameters`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: settings.cdek_account,
      client_secret: settings.cdek_password,
    }),
  });

  const authData = await authResponse.json();
  
  if (!authData.access_token) {
    console.error("CDEK auth failed:", authData);
    throw new Error("Failed to authenticate with CDEK");
  }

  // Calculate tariff
  const tariffResponse = await fetch(`${baseUrl}/calculator/tarifflist`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_location: { city: request.fromCity },
      to_location: { city: request.toCity },
      packages: [{
        weight: (request.weight || 1) * 1000, // Convert to grams
        length: request.dimensions?.length || 20,
        width: request.dimensions?.width || 20,
        height: request.dimensions?.height || 10,
      }],
    }),
  });

  const tariffData = await tariffResponse.json();
  console.log("CDEK tariff response:", tariffData);

  if (tariffData.tariff_codes && tariffData.tariff_codes.length > 0) {
    const cheapest = tariffData.tariff_codes.reduce((min: any, t: any) => 
      t.delivery_sum < min.delivery_sum ? t : min
    );
    
    return {
      provider: "cdek",
      name: "СДЭК",
      price: cheapest.delivery_sum,
      days_min: cheapest.period_min,
      days_max: cheapest.period_max,
      tariff_code: cheapest.tariff_code,
      tariff_name: cheapest.tariff_name,
    };
  }

  throw new Error("No CDEK tariffs available");
}

// Boxberry API
async function calculateBoxberry(settings: DeliverySettings, request: CalculateRequest) {
  const baseUrl = settings.boxberry_test_mode
    ? "https://test.api.boxberry.ru"
    : "https://api.boxberry.ru";

  const params = new URLSearchParams({
    token: settings.boxberry_token,
    method: "DeliveryCosts",
    weight: String((request.weight || 1) * 1000), // grams
    target: request.toCity,
    ordersum: String(request.declaredValue || 1000),
  });

  const response = await fetch(`${baseUrl}/json.php?${params.toString()}`);
  const data = await response.json();
  console.log("Boxberry response:", data);

  if (data.price) {
    return {
      provider: "boxberry",
      name: "Boxberry",
      price: data.price,
      days_min: data.delivery_period || 3,
      days_max: (data.delivery_period || 3) + 2,
    };
  }

  throw new Error(data.err || "Boxberry calculation failed");
}

// Russian Post API
async function calculateRussianPost(settings: DeliverySettings, request: CalculateRequest) {
  const baseUrl = settings.russian_post_test_mode
    ? "https://otpravka-api.pochta.ru"
    : "https://otpravka-api.pochta.ru";

  const auth = btoa(`${settings.russian_post_login}:${settings.russian_post_password}`);

  const response = await fetch(`${baseUrl}/1.0/tariff`, {
    method: "POST",
    headers: {
      "Authorization": `AccessToken ${settings.russian_post_token}`,
      "X-User-Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "index-from": "101000", // Default Moscow index
      "index-to": request.toCity,
      "mail-category": "ORDINARY",
      "mail-type": "POSTAL_PARCEL",
      "mass": (request.weight || 1) * 1000, // grams
      "dimension": request.dimensions ? {
        length: request.dimensions.length * 10, // mm
        width: request.dimensions.width * 10,
        height: request.dimensions.height * 10,
      } : undefined,
      "fragile": false,
    }),
  });

  const data = await response.json();
  console.log("Russian Post response:", data);

  if (data["total-rate"]) {
    return {
      provider: "russian_post",
      name: "Почта России",
      price: data["total-rate"] / 100, // Convert from kopecks
      days_min: data["delivery-time"]?.["min-days"] || 5,
      days_max: data["delivery-time"]?.["max-days"] || 14,
    };
  }

  throw new Error("Russian Post calculation failed");
}

// Get zones from database for fallback
async function getDeliveryZones(provider?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let query = supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true);
  
  if (provider) {
    query = query.eq("provider", provider);
  }
  
  const { data, error } = await query.order("base_cost");
  
  if (error) {
    console.error("Error fetching zones:", error);
    return [];
  }
  
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "calculate";

    switch (action) {
      case "calculate": {
        const body: CalculateRequest = await req.json();
        console.log("Calculating delivery:", body);

        const settings = await getDeliverySettings();
        const results: any[] = [];
        const errors: string[] = [];

        // Try each enabled provider
        if (!body.provider || body.provider === "cdek") {
          if (settings?.cdek_enabled && settings.cdek_account) {
            try {
              const result = await calculateCdek(settings, body);
              results.push(result);
            } catch (e) {
              console.error("CDEK error:", e);
              errors.push(`CDEK: ${e instanceof Error ? e.message : "Unknown error"}`);
            }
          }
        }

        if (!body.provider || body.provider === "boxberry") {
          if (settings?.boxberry_enabled && settings.boxberry_token) {
            try {
              const result = await calculateBoxberry(settings, body);
              results.push(result);
            } catch (e) {
              console.error("Boxberry error:", e);
              errors.push(`Boxberry: ${e instanceof Error ? e.message : "Unknown error"}`);
            }
          }
        }

        if (!body.provider || body.provider === "russian_post") {
          if (settings?.russian_post_enabled && settings.russian_post_token) {
            try {
              const result = await calculateRussianPost(settings, body);
              results.push(result);
            } catch (e) {
              console.error("Russian Post error:", e);
              errors.push(`Почта России: ${e instanceof Error ? e.message : "Unknown error"}`);
            }
          }
        }

        // Fallback to database zones if no API results
        if (results.length === 0) {
          console.log("No API results, falling back to database zones");
          const zones = await getDeliveryZones(body.provider);
          
          for (const zone of zones) {
            results.push({
              provider: zone.provider,
              name: zone.name,
              price: zone.base_cost,
              days_min: zone.delivery_days_min,
              days_max: zone.delivery_days_max,
              free_threshold: zone.free_threshold,
              is_fallback: true,
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            results: results.sort((a, b) => a.price - b.price),
            errors: errors.length > 0 ? errors : undefined,
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case "zones": {
        const zones = await getDeliveryZones();
        return new Response(
          JSON.stringify({ zones }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in delivery-calculate function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
