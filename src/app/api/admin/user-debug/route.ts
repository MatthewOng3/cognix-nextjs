// app/api/admin/user-debug/route.ts
import { NextRequest, NextResponse } from "next/server";

import { envConfig } from "@/app/lib/util/env-config";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";

export async function GET(req: NextRequest) {
//   const supabase = createSupabaseAdminClient()
  
//   // Gate to admin only
//   const adminUserId = req.nextUrl.searchParams.get("adminUserId");
//   if (adminUserId !== envConfig.adminUserId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const targetUserId = req.nextUrl.searchParams.get("userId");
//   if (!targetUserId) {
//     return NextResponse.json({ error: "userId required" }, { status: 400 });
//   }

//   // Fetch whatever you need about the user
//   const { data: userData } = await supabase
//     .from("user")
//     .select("*")
//     .eq("user_id", targetUserId)
//     .single();

  return NextResponse.json({test: "lol"});
}
