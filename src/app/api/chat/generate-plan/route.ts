import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";
import {  envConfig } from "@/app/lib/util/env-config";

const supabase = createSupabaseAdminClient();

export type PlannerResponse = {
  content: string;
  role: string;
  chat_session_id: string;
  message_id: string;
  created_at: string;
  product_markdown_doc: string;
}

/**
 * @description API route where user prompts AI to generate a plan(PRD)
 * @param route app/api/chat/product-doc
 * @param request.chat_session_id Session id for planner chat
 * @returns Response from LLM
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { project_id, chat_session_id, content, product_doc } = await request.json();
    const userId = user.id;

    
    // Validate session ownership (you should implement this based on your auth)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    if (!chat_session_id) {
      return NextResponse.json(
        { error: "Missing chat session id" },
        { status: 400 },
      );
    }

    //Check if user has sufficient credit balance
    const { data: user_credit } = await supabase
      .from("user")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    // user_credit is an object like { credit_balance: 25 }
    if (!user_credit || user_credit.credit_balance <= 0) {
        console.log("Insufficient credits for product ai agent");
        const noCreditResponse:ApiResponse<null> = {
          success: false,
          data: null,
          error: "Insufficient credits"
        }

        return NextResponse.json(noCreditResponse)
    }

    //Insert user message into database
    const { error: insertError } = await supabase
      .from("chat_history")
      .insert({
        content,
        chat_session_id,
        role: "User",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: "Failed to save message" },
        { status: 500 },
      );
    }


    //Request body to be sent to AI server
    const aiRequestBody = {
      message: content,
      project_id,
      chat_session_id,
      user_id: userId,
      product_doc
    };

    let aiDataResponse: PlannerResponse | undefined;

    // Option 2: Wait for AI response (synchronous) - Uncomment if you want to wait
    try {
      const axiosResponse = await axios.post(
        `${envConfig.aiServerUrl}/api/product/generate-doc`,
        aiRequestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          //timeout: timeoutLimit,
          //signal: AbortSignal.timeout(timeoutLimit)
        },
      );

      // Extract the AI response data and transform it to ApiAIResponse format
      aiDataResponse = axiosResponse.data.data;
 
    } catch (error) {
      aiDataResponse = undefined;

      if (axios.isAxiosError(error)) {
        console.error(
          "AI server error:",
          error.response?.status,
          error.response?.data,
        );
      } else {
        console.error("AI server error:", error);
      }
      // You might want to handle this differently based on your requirements
    }
  
    //Return success response which is the AI response
    const response: ApiResponse<PlannerResponse> = {
      success: true,
      data: aiDataResponse,
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
