import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { ApiResponse } from "@/app/lib/util/types/api";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Route to just insert a message
 * @param route app/api/chat/product-doc
 * @param request.chat_session_id Session id for planner chat
 * @returns Response from LLM
 */
export const POST = withAuth(async (request: NextRequest) => {
    try {
        const { chatSessionId, message, role } = await request.json();
        const supabase = createSupabaseAdminClient()
    
        
        if (!chatSessionId) {
            return NextResponse.json(
                { error: "Missing chat session id" },
                { status: 400 },
            );
        }
  
        //Insert Message into DB
        const { error: insertError } = await supabase
        .from("chat_history")
        .insert({
            "content": message,
            "chat_session_id": chatSessionId,
            role,
        })
        .select()
        .single();
        
        if (insertError) {
            return NextResponse.json(
            { success: false, error: `Failed to save message ${insertError}` },
            { status: 500 },
            );
        }
  
      //Return success response which is the AI response
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        error: undefined,
      };
  
      return NextResponse.json(response);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Failed to process message ${error}` },
        { status: 500 },
      );
    }
  });
  