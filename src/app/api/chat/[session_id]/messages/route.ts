import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";
import type { ChatMessagesResponse } from "@/app/lib/util/types/chat";
import { withAuth } from "@/app/lib/api/withAuth";
import { User } from "@supabase/supabase-js";

/**
 * @description Server side API route to fetch chat messages for a given session
 * @param params - The parameters object
 * @param params.session_id - The session id
 * @param params.limit - The limit of messages to fetch each time
 * @param params.cursor - The cursor to use for pagination, timestamp of last message sent so
 * we know where to start fetching from.
 * @returns The chat messages and pagination information
 */
export const GET = withAuth(async (
  request: NextRequest,
  user: User,
  params?: { session_id: string },
) =>  {
  try {
     
    const supabase = createSupabaseAdminClient();

   // handle undefined params safely
    const sessionId = params?.session_id;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing session_id" },
        { status: 400 },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");
    // const _projectId = searchParams.get("project_id");

    // Validate session ownership (you should implement this based on your auth)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // First, check if the chat session exists
    const { error: sessionError } = await supabase
      .from("chat_session")
      .select("chat_session_id")
      .eq("chat_session_id", sessionId)
      .single();

    //If error return back to client with error message
    if (sessionError) {
      console.error("Error checking chat session:", sessionError);

      const sessionErrorResponse: ApiResponse<null> = {
        success: true,
        data: null,
        error: sessionError.message,
      };

      return NextResponse.json(sessionErrorResponse, { status: 404 });
    }

    // If session exists, try to fetch messages
    let query = supabase
      .from("chat_history")
      .select("*")
      .eq("chat_session_id", sessionId)
      .order("created_at", { ascending: false }) // Most recent first
      .limit(limit + 1); // Get one extra to check if there are more

    // Apply cursor-based pagination
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    // Check if there are more messages
    const has_more = messages.length > limit;
    const data = has_more ? messages.slice(0, limit) : messages;
    const nextCursor = has_more ? data[data.length - 1]?.created_at : undefined;

    const response: ChatMessagesResponse = {
      data: data.reverse(), // Reverse to show oldest first in UI
      pagination: {
        has_more,
        next_cursor: nextCursor,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat messages API:", error);
    return NextResponse.json(
      { error: `Internal server error ${error}` },
      { status: 500 },
    );
  }
})
