 
import { ProjectUpdateData } from "@/app/onboarding/project/[project_id]/[session_id]/product_doc/page";
import type { Block } from "@blocknote/core";

/**
 * @description Handler for saving product document in both json and markdown format
 */
export async function handleSaveBlocks(
  editorContent: Block[],
  editorMarkdown: string,
  projectId: string,
) {
  //Update product_doc row
  const updateBody:ProjectUpdateData = {
    project_id: projectId,
    document_json: editorContent,
    document_markdown: editorMarkdown
  }

  const saveResponse = await fetch(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateBody),
    credentials: "include",
  });

  console.log("SAVE RESPONSE IN HANDLESAVEBLOCKS", saveResponse);
}
