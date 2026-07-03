import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";

export const GET = withAuth(
  async (_request: NextRequest, user: User, params?: { thread_id: string }) => {
    try {
      const threadId = params?.thread_id;
      if (!threadId) {
        return NextResponse.json(
          { success: false, error: "Missing thread_id" },
          { status: 400 },
        );
      }

      const supabase = createSupabaseAdminClient();

      const { data: firstUserMessage, error: messageError } = await supabase
        .from("chat_history")
        .select("content, chat_session_id")
        .eq("thread_id", threadId)
        .eq("role", "User")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (messageError || !firstUserMessage) {
        return NextResponse.json(
          { success: false, error: "Original prompt not found" },
          { status: 404 },
        );
      }

      const { data: session, error: sessionError } = await supabase
        .from("chat_session")
        .select("user_id")
        .eq("chat_session_id", firstUserMessage.chat_session_id)
        .single();

      if (sessionError || !session || session.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          content: firstUserMessage.content,
        },
      });
    } catch (error) {
      console.error("Error fetching original thread prompt:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch original prompt" },
        { status: 500 },
      );
    }
  },
);
