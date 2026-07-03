import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";
import { envConfig } from "@/app/lib/util/env-config";

export type ApiAIResponse = {
  message_id: string;
  chat_session_id: string;
  created_at: string;
  role: string;
  message: string;
};

/**
 * @description Use AI to create a new product document when starting a new project
 * @param route app/api/chat/generate-plan
 * @param request.project_id - The project id
 * @returns
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const { content, project_id, session_id, created_at } =
      await request.json();

    // Validate session ownership (you should implement this based on your auth)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    if (!project_id || !session_id || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user_id from project table using project_id
    const { data: projectData, error: projectError } = await supabase
      .from("project")
      .select("user_id")
      .eq("project_id", project_id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }

    const user_id = projectData.user_id;

    //Insert message into database
    const { error } = await supabase
      .from("chat_history")
      .insert({
        content,
        chat_session_id: session_id,
        role: "User",
        created_at,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Failed to send message ${error}` },
        { status: 500 },
      );
    }

   

    const aiRequestBody = {
      message: content,
      project_id,
      chat_session_id: session_id,
      user_id,
    };

    // Option 1: Fire-and-forget (asynchronous) - AI server processes in background
    // This returns immediately without waiting for AI response
    // axios.post(`${process.env.APP_ENV === 'DEV' ? process.env.AI_SERVER_DEV : process.env.AI_SERVER_PROD}/api/builder/new-user-message`, aiRequestBody, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     }
    // }).catch(error => {
    //     console.error('Failed to send message to AI server:', error.message);
    //     // Don't fail the request if AI server is down
    // });

    let aiDataResponse: ApiAIResponse | undefined;

    // Option 2: Wait for AI response (synchronous) - Uncomment if you want to wait
    try {
      const timeoutLimit = 60 * 1000; // 60 seconds
      const axiosResponse = await axios.post(
        `${envConfig.aiServerUrl}/api/builder/new-user-message`,
        aiRequestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: timeoutLimit,
          signal: AbortSignal.timeout(timeoutLimit),
        },
      );

      // Extract the AI response data and transform it to ApiAIResponse format
      aiDataResponse = axiosResponse.data.data;

      console.log("AI response object:", aiDataResponse);
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
    const response: ApiResponse<ApiAIResponse> = {
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
}
