import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  returnUrl: string;
  failUrl: string;
  description?: string;
}

interface CheckStatusRequest {
  orderId: string;
}

interface CallbackRequest {
  orderId: string;
  orderNumber: string;
  status: string;
}

// Get payment settings from database
async function getPaymentSettings() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "payment")
    .single();
  
  if (error) {
    console.error("Error fetching payment settings:", error);
    throw new Error("Failed to fetch payment settings");
  }
  
  return data?.value as {
    alfa_bank_enabled: boolean;
    alfa_bank_username: string;
    alfa_bank_password: string;
    alfa_bank_test_mode: boolean;
  } | null;
}

// Get Alfa-Bank API URL based on mode
function getAlfaBankUrl(testMode: boolean): string {
  return testMode 
    ? "https://web.rbsuat.com/ab/rest"  // Test environment
    : "https://pay.alfabank.ru/payment/rest"; // Production environment
}

// Create payment in Alfa-Bank
async function createPayment(
  settings: NonNullable<Awaited<ReturnType<typeof getPaymentSettings>>>,
  request: CreatePaymentRequest
) {
  const baseUrl = getAlfaBankUrl(settings.alfa_bank_test_mode);
  
  const params = new URLSearchParams({
    userName: settings.alfa_bank_username,
    password: settings.alfa_bank_password,
    orderNumber: request.orderId,
    amount: String(Math.round(request.amount * 100)), // Alfa-Bank expects kopecks
    returnUrl: request.returnUrl,
    failUrl: request.failUrl,
    description: request.description || `Заказ #${request.orderId}`,
  });

  console.log(`Creating payment for order ${request.orderId}, amount: ${request.amount} RUB`);

  const response = await fetch(`${baseUrl}/register.do?${params.toString()}`, {
    method: "POST",
  });

  const data = await response.json();
  console.log("Alfa-Bank register response:", data);

  if (data.errorCode && data.errorCode !== "0") {
    throw new Error(data.errorMessage || `Payment creation failed: ${data.errorCode}`);
  }

  return {
    orderId: data.orderId, // Alfa-Bank's internal order ID
    formUrl: data.formUrl, // URL to redirect user for payment
  };
}

// Check payment status
async function checkPaymentStatus(
  settings: NonNullable<Awaited<ReturnType<typeof getPaymentSettings>>>,
  alfaOrderId: string
) {
  const baseUrl = getAlfaBankUrl(settings.alfa_bank_test_mode);
  
  const params = new URLSearchParams({
    userName: settings.alfa_bank_username,
    password: settings.alfa_bank_password,
    orderId: alfaOrderId,
  });

  console.log(`Checking status for Alfa-Bank order: ${alfaOrderId}`);

  const response = await fetch(`${baseUrl}/getOrderStatus.do?${params.toString()}`, {
    method: "POST",
  });

  const data = await response.json();
  console.log("Alfa-Bank status response:", data);

  // Status codes: 0 - registered, 1 - pre-authorized, 2 - paid, 3 - canceled, 4 - refunded, 5 - ACS initiated, 6 - authorization rejected
  const statusMap: Record<number, string> = {
    0: "registered",
    1: "pre_authorized",
    2: "paid",
    3: "canceled",
    4: "refunded",
    5: "acs_initiated",
    6: "rejected",
  };

  return {
    status: statusMap[data.OrderStatus] || "unknown",
    orderStatus: data.OrderStatus,
    amount: data.Amount ? data.Amount / 100 : 0,
    errorCode: data.ErrorCode,
    errorMessage: data.ErrorMessage,
    pan: data.Pan, // Masked card number
    cardholderName: data.cardholderName,
  };
}

// Update order status in database
async function updateOrderStatus(orderId: string, paymentStatus: string, alfaOrderId?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const updateData: Record<string, unknown> = {
    payment_status: paymentStatus,
  };

  if (paymentStatus === "paid") {
    updateData.status = "confirmed";
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order:", error);
    throw new Error("Failed to update order status");
  }

  console.log(`Order ${orderId} updated to payment_status: ${paymentStatus}`);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get payment settings
    const settings = await getPaymentSettings();

    if (!settings?.alfa_bank_enabled) {
      console.log("Alfa-Bank integration is disabled");
      return new Response(
        JSON.stringify({ error: "Alfa-Bank integration is not enabled" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!settings.alfa_bank_username || !settings.alfa_bank_password) {
      console.log("Alfa-Bank credentials not configured");
      return new Response(
        JSON.stringify({ error: "Alfa-Bank credentials not configured" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Route to appropriate handler
    switch (action) {
      case "create": {
        const body: CreatePaymentRequest = await req.json();
        console.log("Creating payment:", body);
        
        const result = await createPayment(settings, body);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case "status": {
        const body: CheckStatusRequest = await req.json();
        console.log("Checking payment status:", body);
        
        const result = await checkPaymentStatus(settings, body.orderId);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      case "callback": {
        // This is called by Alfa-Bank after payment
        const body: CallbackRequest = await req.json();
        console.log("Payment callback received:", body);
        
        // Verify payment status with Alfa-Bank
        if (body.orderId) {
          const status = await checkPaymentStatus(settings, body.orderId);
          
          // Update order in database
          await updateOrderStatus(body.orderNumber, status.status, body.orderId);
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: create, status, or callback" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in alfa-bank-payment function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
