import { type NextRequest, NextResponse } from "next/server";
import { getIpFromRequest } from "@/app/lib/api/get_ip";
import { getBetaStatus } from "@/app/lib/util/beta-gate";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";

type AuthUserPayload = {
  id: string;
  email?: string | null;
  created_at?: string | null;
};

/**
 * @description Returns the public beta signup state for clients that need to
 * disable signup UI before creating an auth user.
 */
export async function GET() {
  const betaStatus = await getBetaStatus();
  return NextResponse.json({
    isOpen: betaStatus.isOpen,
    slotsUsed: betaStatus.slotsUsed,
    maxSlots: betaStatus.maxSlots,
    reason: betaStatus.reason,
  });
}

/**
 * @description Handles the registration of a new user
 * @param request - The request object
 * @returns The response object
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = (await request.json()) as { user?: AuthUserPayload };

    if (!user?.id) {
      return NextResponse.json({ error: "Missing user" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const ip = getIpFromRequest(request);

    // OAuth and some email flows may hit this endpoint more than once.
    // Treat it as "ensure app user row exists" instead of "always insert".
    const { data: existingUser, error: existingUserError } = await supabase
      .from("user")
      .select("user_pk, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingUserError) {
      console.error("User lookup error:", existingUserError);
      return NextResponse.json(
        { error: existingUserError.message },
        { status: 400 },
      );
    }

    if (existingUser) {
      return NextResponse.json({
        user,
        userData: existingUser,
      });
    }

    const betaStatus = await getBetaStatus();

    if (!betaStatus.isOpen) {
      return NextResponse.json(
        {
          error: "beta_full",
          betaStatus: {
            isOpen: betaStatus.isOpen,
            slotsUsed: betaStatus.slotsUsed,
            maxSlots: betaStatus.maxSlots,
            reason: betaStatus.reason,
          },
        },
        { status: 403 },
      );
    }

    // Defensive fallback: some environments have an out-of-sync identity
    // sequence on public.user.user_pk, so we compute the next PK ourselves.
    const { data: latestUser, error: latestUserError } = await supabase
      .from("user")
      .select("user_pk")
      .order("user_pk", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestUserError) {
      console.error("Latest user lookup error:", latestUserError);
      return NextResponse.json(
        { error: latestUserError.message },
        { status: 400 },
      );
    }

    const nextUserPk = (latestUser?.user_pk ?? 0) + 1;

    const { data: userData, error: userError } = await supabase
      .from("user")
      .insert({
        user_pk: nextUserPk,
        plan_id: 2,
        is_premium: true,
        user_id: user.id,
        ip_address: ip,
      })
      .select()
      .single();

    if (userError) {
      // If another concurrent request created the row first, treat that as
      // success instead of surfacing a duplicate/create race to the user.
      const { data: retryExistingUser, error: retryExistingUserError } =
        await supabase
          .from("user")
          .select("user_pk, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (retryExistingUserError) {
        console.error("Retry user lookup error:", retryExistingUserError);
        return NextResponse.json(
          { error: retryExistingUserError.message },
          { status: 400 },
        );
      }

      if (retryExistingUser) {
        return NextResponse.json({
          user,
          userData: retryExistingUser,
        });
      }

      console.error("User creation error:", userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    return NextResponse.json({
      user,
      userData,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
