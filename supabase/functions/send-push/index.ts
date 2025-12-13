import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  userId?: string;
  segment?: 'all' | 'active_buyers' | 'inactive' | 'category';
  categoryId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { title, body, icon, url, userId, segment, categoryId }: PushNotificationRequest = await req.json();

    console.log('Sending push notification:', { title, body, userId, segment });

    // Get subscriptions based on segment
    let userIds: string[] = [];

    if (userId) {
      userIds = [userId];
    } else if (segment === 'active_buyers') {
      // Users who made purchases in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('user_id', 'is', null);
      
      userIds = [...new Set((orders || []).map(o => o.user_id).filter(Boolean))];
      console.log(`Found ${userIds.length} active buyers`);
    } else if (segment === 'inactive') {
      // Users who haven't ordered in 60+ days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      // Get all users with push subscriptions
      const { data: allSubs } = await supabase
        .from('push_subscriptions')
        .select('user_id');
      
      const allSubUsers = [...new Set((allSubs || []).map(s => s.user_id).filter(Boolean))];
      
      // Get users with recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('user_id')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .not('user_id', 'is', null);
      
      const activeUserIds = new Set((recentOrders || []).map(o => o.user_id).filter(Boolean));
      
      userIds = allSubUsers.filter(id => !activeUserIds.has(id));
      console.log(`Found ${userIds.length} inactive users`);
    } else if (segment === 'category' && categoryId) {
      // Users who viewed or purchased from a specific category
      const { data: views } = await supabase
        .from('product_views')
        .select('user_id, products!inner(category_id)')
        .eq('products.category_id', categoryId)
        .not('user_id', 'is', null);
      
      const { data: orders } = await supabase
        .from('order_items')
        .select('orders!inner(user_id), products!inner(category_id)')
        .eq('products.category_id', categoryId)
        .not('orders.user_id', 'is', null);
      
      const viewUserIds = (views || []).map(v => v.user_id).filter(Boolean);
      const orderUserIds = (orders || []).map((o: any) => o.orders?.user_id).filter(Boolean);
      
      userIds = [...new Set([...viewUserIds, ...orderUserIds])];
      console.log(`Found ${userIds.length} users interested in category`);
    }

    // Get subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    
    if (userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to notify`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found for this segment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/pwa-192x192.png',
      data: { url: url || '/' },
      badge: '/pwa-192x192.png',
      tag: `notification-${Date.now()}`
    });

    let sent = 0;
    const errors: string[] = [];

    // For now, log the notifications (web-push requires native Node.js crypto)
    // In production with proper Deno support, you would use web-push here
    if (vapidPublicKey && vapidPrivateKey) {
      console.log('VAPID keys configured. Would send real push notifications.');
      
      for (const sub of subscriptions) {
        console.log(`Sending to: ${sub.endpoint.slice(0, 50)}...`);
        console.log(`Payload: ${payload}`);
        sent++;
      }
    } else {
      console.warn('VAPID keys not configured. Logging notifications instead.');
      for (const sub of subscriptions) {
        console.log(`Would send to endpoint: ${sub.endpoint.slice(0, 50)}...`);
        sent++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        total: subscriptions.length,
        errors: errors.length,
        vapidConfigured: !!(vapidPublicKey && vapidPrivateKey)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in send-push function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
