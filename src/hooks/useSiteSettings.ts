import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneralSettings {
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
}

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  work_hours: string;
}

export interface SocialSettings {
  vk: string;
  telegram: string;
  whatsapp: string;
  youtube: string;
  rutube: string;
  dzen: string;
}

export interface SeoSettings {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export interface DeliverySettings {
  free_delivery_threshold: number;
  delivery_info: string;
  delivery_regions: string[];
}

export interface DeliveryProvidersSettings {
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

export interface PaymentSettings {
  methods: string[];
  installment_available: boolean;
  alfa_bank_enabled: boolean;
  alfa_bank_username: string;
  alfa_bank_password: string;
  alfa_bank_test_mode: boolean;
}

export interface FeatureSettings {
  show_ai_recommendations: boolean;
  show_stories: boolean;
  show_promo_banner: boolean;
  enable_chat: boolean;
}

export interface PromoCard {
  id: string;
  type: "main" | "flash_sale" | "subscription" | "custom";
  title: string;
  description: string;
  badge?: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  end_time?: string; // ISO date string for flash sale countdown
  discount_percent?: number;
  bg_color?: string;
}

export interface PromoCardsSettings {
  cards: PromoCard[];
}

export type SettingsKey = 'general' | 'contacts' | 'social' | 'seo' | 'delivery' | 'delivery_providers' | 'payment' | 'features' | 'promo_cards';

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      
      return settingsMap as {
        general: GeneralSettings;
        contacts: ContactSettings;
        social: SocialSettings;
        seo: SeoSettings;
        delivery: DeliverySettings;
        delivery_providers: DeliveryProvidersSettings;
        payment: PaymentSettings;
        features: FeatureSettings;
        promo_cards: PromoCardsSettings;
      };
    },
  });

  const updateSettings = useMutation({
    mutationFn: async ({ key, value }: { key: SettingsKey; value: any }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Настройки сохранены');
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + error.message);
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
