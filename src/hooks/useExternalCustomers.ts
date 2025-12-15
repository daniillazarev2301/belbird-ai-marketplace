/**
 * Hook for managing customer data via External API (Self-Hosted)
 * Falls back to Supabase profiles if external API is not configured
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, isExternalApiConfigured } from '@/lib/externalApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  loyalty_points: number;
  customer_tags?: string[];
  customer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  name: string;
  city: string;
  street?: string;
  house?: string;
  apartment?: string;
  postal_code?: string;
  phone?: string;
  is_default: boolean;
  provider?: string;
  pickup_point_id?: string;
  pickup_point_name?: string;
  pickup_point_address?: string;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
}

export interface CreateAddressData {
  name: string;
  city: string;
  street?: string;
  house?: string;
  apartment?: string;
  postal_code?: string;
  phone?: string;
  is_default?: boolean;
  provider?: string;
  pickup_point_id?: string;
  pickup_point_name?: string;
  pickup_point_address?: string;
}

/**
 * Fetch customer profile
 */
async function fetchCustomerProfile(): Promise<CustomerProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (isExternalApiConfigured()) {
    const { data, error } = await apiRequest<CustomerProfile>('/api/customers/me');
    if (!error && data) return data;
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return { ...data, user_id: user.id } as CustomerProfile;
}

/**
 * Fetch customer addresses
 */
async function fetchAddresses(): Promise<CustomerAddress[]> {
  if (isExternalApiConfigured()) {
    const { data, error } = await apiRequest<CustomerAddress[]>('/api/customers/addresses');
    if (!error && data) return data;
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .order('is_default', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update customer profile
 */
async function updateProfileRequest(profileData: UpdateProfileData): Promise<CustomerProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (isExternalApiConfigured()) {
    const { data, error } = await apiRequest<CustomerProfile>('/api/customers/me', {
      method: 'PATCH',
      body: profileData,
    });
    if (!error && data) return data;
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, user_id: user.id } as CustomerProfile;
}

/**
 * Create new address
 */
async function createAddressRequest(addressData: CreateAddressData): Promise<CustomerAddress> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (isExternalApiConfigured()) {
    const { data, error } = await apiRequest<CustomerAddress>('/api/customers/addresses', {
      method: 'POST',
      body: addressData,
    });
    if (!error && data) return data;
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('saved_addresses')
    .insert({ ...addressData, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete address
 */
async function deleteAddressRequest(addressId: string): Promise<void> {
  if (isExternalApiConfigured()) {
    const { error } = await apiRequest(`/api/customers/addresses/${addressId}`, {
      method: 'DELETE',
    });
    if (!error) return;
  }

  // Fallback to Supabase
  const { error } = await supabase
    .from('saved_addresses')
    .delete()
    .eq('id', addressId);

  if (error) throw error;
}

// Hooks

export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customerProfile'],
    queryFn: fetchCustomerProfile,
  });
}

export function useCustomerAddresses() {
  return useQuery({
    queryKey: ['customerAddresses'],
    queryFn: fetchAddresses,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      toast.success('Профиль обновлён');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления профиля');
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerAddresses'] });
      toast.success('Адрес добавлен');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка добавления адреса');
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerAddresses'] });
      toast.success('Адрес удалён');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка удаления адреса');
    },
  });
}
