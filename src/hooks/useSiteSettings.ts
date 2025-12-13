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

export interface PaymentSettings {
  methods: string[];
  installment_available: boolean;
}

export interface FeatureSettings {
  show_ai_recommendations: boolean;
  show_stories: boolean;
  show_promo_banner: boolean;
  enable_chat: boolean;
}

export type SettingsKey = 'general' | 'contacts' | 'social' | 'seo' | 'delivery' | 'payment' | 'features';

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
        payment: PaymentSettings;
        features: FeatureSettings;
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
