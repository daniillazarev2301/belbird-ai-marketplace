/**
 * Hook for managing orders via External API (Self-Hosted)
 * Falls back to Supabase if external API is not configured
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, isExternalApiConfigured } from '@/lib/externalApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  shipping_address: Json | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CreateOrderData {
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: Json;
  payment_method: string;
  notes?: string;
  promo_code?: string;
  loyalty_points_used?: number;
}

/**
 * Fetch orders from external API or Supabase
 */
async function fetchOrders(): Promise<Order[]> {
  if (isExternalApiConfigured()) {
    const { data, error } = await apiRequest<Order[]>('/api/orders');
    if (error) {
      console.warn('External API error, falling back to Supabase:', error);
    } else if (data) {
      return data;
    }
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(order => ({
    ...order,
    items: order.order_items as OrderItem[]
  }));
}

/**
 * Create order via external API or Supabase
 */
async function createOrderRequest(orderData: CreateOrderData): Promise<Order> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (isExternalApiConfigured()) {
    const { data, error } = await apiRequest<Order>('/api/orders', {
      method: 'POST',
      body: orderData,
    });
    if (error) {
      console.warn('External API error, falling back to Supabase:', error);
    } else if (data) {
      return data;
    }
  }

  // Fallback to Supabase - create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      payment_status: 'pending',
      payment_method: orderData.payment_method,
      shipping_address: orderData.shipping_address,
      notes: orderData.notes || null,
      total_amount: orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      }))
    );

  if (itemsError) throw itemsError;

  return order as Order;
}

/**
 * Hook to fetch user orders
 */
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrderRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Заказ успешно создан');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка создания заказа');
    },
  });
}

/**
 * Hook to get single order details
 */
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      if (isExternalApiConfigured()) {
        const { data, error } = await apiRequest<Order>(`/api/orders/${orderId}`);
        if (!error && data) return data;
      }

      // Fallback to Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return { ...data, items: data.order_items as OrderItem[] } as Order;
    },
    enabled: Boolean(orderId),
  });
}
