import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ChatSession } from "@/app/lib/util/supabase/types/tables";

const supabase = createSupabaseAdminClient();

/**
 * @description Create a new chat session for a project
 * @param projectId - The ID of the project
 * @param userId - The ID of the user
 * @param type - The type of chat session (Builder or Planner)
 * @returns The chat session data
 */
export async function createChatSession(
  projectId: string,
  userId: string,
  type: "Builder" | "Planner",
): Promise<ChatSession> {
  const { data, error } = await supabase
    .from("chat_session")
    .insert({
      project_id: projectId,
      user_id: userId,
      chat_type: type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }

  return data as ChatSession;
}
