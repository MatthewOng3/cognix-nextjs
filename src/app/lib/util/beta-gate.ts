import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";

export interface BetaStatus {
  isOpen: boolean;
  slotsUsed: number;
  maxSlots: number;
  creditsConsumed: number;
  maxCapacityUsd: number;
  creditsPerUserUsd: number;
  reason: "manual_closed" | "capacity_reached" | null;
}

/**
 * @description Checks whether the beta is currently accepting new registrations.
 * Queries the beta_config singleton row and counts users registered since start_date.
 * Credits consumed = user_count * credits_per_user_usd.
 * Beta is closed when is_open is false OR credits consumed >= max_capacity_usd.
 */
export async function getBetaStatus(): Promise<BetaStatus> {
  const supabase = createSupabaseAdminClient();

  // Fetch beta config (singleton row)
  const { data: config, error: configError } = await supabase
    .from("beta_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (configError || !config) {
    // If table doesn't exist or no config row, default to closed for safety
    console.error("Failed to fetch beta_config:", configError);
    return {
      isOpen: false,
      slotsUsed: 0,
      maxSlots: 0,
      creditsConsumed: 0,
      maxCapacityUsd: 0,
      creditsPerUserUsd: 0,
      reason: "manual_closed",
    };
  }

  const maxCapacityUsd = Number(config.max_capacity_usd);
  const creditsPerUser = Number(config.credits_per_user_usd);
  const maxSlots =
    creditsPerUser > 0 ? Math.floor(maxCapacityUsd / creditsPerUser) : 0;

  // Count users registered since the beta round start date
  const { count, error: countError } = await supabase
    .from("user")
    .select("*", { count: "exact", head: true })
    .gte("created_at", config.start_date);

  if (countError) {
    console.error("Failed to count beta users:", countError);
    return {
      isOpen: false,
      slotsUsed: 0,
      maxSlots,
      creditsConsumed: 0,
      maxCapacityUsd,
      creditsPerUserUsd: creditsPerUser,
      reason: "manual_closed",
    };
  }

  const slotsUsed = count ?? 0;
  const creditsConsumed = slotsUsed * creditsPerUser;
  const capacityReached = creditsConsumed >= maxCapacityUsd;
  const manuallyClosed = !config.is_open;

  return {
    isOpen: !manuallyClosed && !capacityReached,
    slotsUsed,
    maxSlots,
    creditsConsumed,
    maxCapacityUsd,
    creditsPerUserUsd: creditsPerUser,
    reason: capacityReached
      ? "capacity_reached"
      : manuallyClosed
        ? "manual_closed"
        : null,
  };
}
