import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type EntityType = "product" | "order" | "category" | "brand" | "review" | "promo_code" | "blog_post" | "page";
type ActionType = "create" | "update" | "delete";

interface LogActivityParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, string | number | boolean | null>;
}

export const logAdminActivity = async ({
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("admin_activity_logs").insert([{
      user_id: user.id,
      action: `${action}_${entityType}`,
      entity_type: entityType,
      entity_id: entityId || null,
      details: (details || {}) as Json,
    }]);
  } catch (error) {
    console.error("Error logging admin activity:", error);
  }
};

export const useAdminActivityLog = () => {
  return { logActivity: logAdminActivity };
};
