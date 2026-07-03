/* eslint-disable */
"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { Button } from "@/app/components/ui/button";
import type {
  ApiResponse,
  FetchProductDocResponse,
} from "@/app/lib/util/types/api";
import { Loader2 } from "lucide-react"; // ✅ spinner icon

//Block note
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@/app/lib/styles/blocknote.css";
import { type Block } from "@blocknote/core";
import { useAuth } from "@/app/hooks/use-auth";
import "../../../lib/styles/blocknote.css";
import { useProject } from "@/app/hooks/use-project";
import { useAlert } from "@/app/components/AlertNotif";
 
import { useCreateBlockNote } from "@blocknote/react";
import { Project } from "@/app/lib/util/supabase/types/tables";
import { defaultDocument } from "./defaultDocument";


export type GeneratePrdResponse = {
	message_id: string;
	chat_session_id: string;
	created_at: string;
	role: string;
	message: string;
  };
  
// Allows any subset of ProjectData fields to be updated
export type ProjectUpdateData = Partial<Project> & { project_id: string };
  
  
// export const defaultDocument = [
// 	{
// 	  id: "initial",
// 	  type: "paragraph",
// 	  props: {
// 		backgroundColor: "default",
// 		textColor: "default",
// 		textAlignment: "left",
// 	  },
// 	  content: [
// 		{
// 		  type: "text",
// 		  text: "Start writing your product document here...",
// 		  styles: {
// 			bold: true
// 		  },
// 		},
// 	  ],
// 	},
//   ] as unknown as Block[]; // ✅ bypass TypeScript strict typing

/**
 * @description Product Plan Page
 * @route project/[project_id]/plan
 * @returns
 */
function ProductPlanningPage() {
	//Grab user auth object
	const { user, userId, loading  } = useAuth();
	
	// Get project state using custom hook
	const { activeProject } = useProject();
	const {showAlert} = useAlert();
	
	//State to store the entire document in a json array of blocks
	const [editorContent, setEditorContent] = useState<Block[] | undefined>(
		undefined,
	);
	const [editorMarkdown, setEditorMarkdown] = useState<string | undefined>(
		undefined,
	);
	//const [editorC, setEditor] = useState<any>(null);
	const [loadingDoc, setIsLoadingDoc] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState(false);

	// ✅ Create editor ONCE with optional initial content
	const editor = useCreateBlockNote({
		initialContent: defaultDocument,  
	});
	
	
	useEffect(() => {
		if (!editor) return;
		
		const setContent = async () => {
			if (editorContent && editorContent.length > 0) {
				editor.replaceBlocks(editor.document, editorContent);
			} else if (editorMarkdown) {
				const blocks = await editor.tryParseMarkdownToBlocks(editorMarkdown);
				editor.replaceBlocks(editor.document, blocks)
			}
		};
		
		setContent();
	}, [editor, editorContent, editorMarkdown]);
	

	//On initial load, fetch latest document saved
	//Fetch product doc when user is authenticated
	useEffect(() => {
		//Only runs once user is authenticated and project data is loaded
		if (userId && !loading && activeProject) {
			fetchProductDoc();
		}
	}, [userId, activeProject, loading ]);

	// Creates a new editor instance with potential intiial content
	//This function fires when loadingDoc or editorContent dependency changes
	// const editor = React.useMemo(() => {
	// 	//If loading is still true or editor content is undefined
	// 	if (loadingDoc || editorContent === undefined) return undefined;
	// 	//Else create editor with initial content
	// 	return BlockNoteEditor.create({ initialContent: editorContent });
	// }, [loadingDoc, editorContent]);

	/**
	 * @description Fetch saved product document for the user
	 */
	const fetchProductDoc = useCallback(async () => {
		if (!userId) return;

		setIsLoadingDoc(true);

		//API call to fetch projects
		try {
			const response = await fetch(
				`/api/product_doc?projectId=${activeProject?.projectId}`,
				{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				},
			);
			// console.log("[fetchProductDoc] status", response.status);
			// console.log("[fetchProductDoc] headers", Array.from(response.headers.entries()));

			const result: ApiResponse<FetchProductDocResponse> =
			await response.json();
			
			if (!response.ok) {
				console.error("Error fetching projects:", result.error);
				setEditorContent([]);
			} else if (result.success &&
				result.data?.document_json &&
				result.data.document_json.length > 0 &&
				editor
			) {
				setEditorContent(result.data.document_json);
				//setEditorContent(result.data.document_json);
				//editor.replaceBlocks(editor.document, result.data.document_json);
			}
			//Fallback if havent save block state before so only markdown available
			else if (result.success && result.data?.document_markdown){
				//console.log("SETTING EDITOR CONTENT", result.data.document_markdown)
 
				setEditorMarkdown(result.data.document_markdown);
			}
		} catch (error) {
			console.error("Error fetching projects:", error);
			setEditorContent([]);
		} finally {
			setIsLoadingDoc(false);
		}
	}, [userId, activeProject?.projectId, editor]);

	/**
	 * @description Handler for saving product document or updating
	 */
	async function handleSave() {
		if (!activeProject?.projectId || !activeProject) {
		  console.error("Missing projectId in PRD doc save");
		  return;
		}
	  
		try {
			setIsSaving(true); // ✅ start spinner
			// Converts the editor's contents from Block objects to Markdown and store to state.
			const markdown = await editor.blocksToMarkdownLossy(editor.document);

			const updateProductDoc: ProjectUpdateData = {
				project_id: activeProject.projectId,
				document_json: editor?.document,
				document_markdown: markdown,
				updated_at: new Date().toISOString(),
			};
	  
			const saveResponse = await fetch(
				`/api/projects/${activeProject.projectId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updateProductDoc),
					credentials: "include",
				}
			);
	  
			const result = await saveResponse.json();
		
			if (result.success) {
				showAlert("Document saved", "success");
			}
		} catch (err) {
			console.error("Save failed", err);
			showAlert("Failed to save document", "error");
		} finally {
		  	setIsSaving(false); // ✅ stop spinner
		}
	}

  /**
   * @description Handle the send message event to backend
   * @param content - The content of the message
   */
  // async function handleSendMessage(

  // 	content: string,
  // ): Promise<ChatMessage | undefined> {
  // 	if (!content.trim()) return;
  // 	setSending(true);

  // 	// Construct the message object
  // 	const newMessage: ChatMessage = {
  // 		chat_session_id: project?.plannerSessionId || "", // ensure sessionId is available in scope
  // 		role: "User",
  // 		content,
  // 		created_at: new Date().toISOString(), //Date with timestamp and timezone
  // 	};

  // 	try {
  // 		//Api call to NextJS backend to execute send message logic
  // 		const response = await fetch("/api/chat/send-message", {
  // 			method: "POST",
  // 			headers: { "Content-Type": "application/json" },
  // 			body: JSON.stringify({
  // 			content,
  // 			project_id: project?.project_id,
  // 			session_id: project?.builderSessionId,
  // 			created_at: newMessage.created_at,
  // 			}),
  // 		});

  // 		//
  // 		const responseData: ApiResponse<BuilderChatResponse> =
  // 			await response.json();

  // 		if (!response.ok || !responseData.success) {
  // 			throw new Error(responseData.error || "Failed to send message");
  // 		}

  // 		const responseMessage: ChatMessage = {
  // 			chat_session_id: project?.builderSessionId || "",
  // 			role: responseData.data?.role || "AI",
  // 			content: responseData.data?.content || "",
  // 			created_at: responseData.data?.created_at || "",
  // 		};

  // 		return responseMessage;
  // 	} catch (error) {
  // 	// Optionally handle error (e.g., show toast, revert optimistic update)
  // 	console.error(error);
  // 	} finally {
  // 	setSending(false);
  // 	}

  // return undefined;
  // // TODO: Integrate with Redux or Context for global chat state persistence
  // }

  // Show loading overlay
  // if (loading) {
  // 	return <LoadingOverlay text="Loading chat session..." />;
  // }

  // // Show message if no chat session is available
  // if (!project?.plannerSessionId) {
  // 	return (
  // 	<div className="h-full flex items-center justify-center">
  // 		<div className="text-center">
  // 		<Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
  // 		<p className="text-muted-foreground mb-4">
  // 			No product chat session found for this project.
  // 		</p>
  // 		<p className="text-sm text-muted-foreground mb-4">
  // 			This might happen if the project was created without chat sessions.
  // 		</p>
  // 		<Button onClick={() => router.push("/project")} variant="outline">
  // 			Back to Projects
  // 		</Button>
  // 		</div>
  // 	</div>
  // 	);
  // }
 
  //If no editor content present and no authenticated user show loading screen
  if (!user) {
    return <LoadingOverlay text="Loading Product Document..." />;
  }

  return (
    <div className="h-full flex">
      {/* Left Column - AI Chat Section */}
      <div className="w-2/3 flex flex-col h-full">
          	<div className="w-full p-6 flex items-center justify-between">
				<div className="p-6 border-border flex-shrink-0">
					<h1 className="text-xl font-semibold text-foreground mb-2">
						Project Planner
					</h1>
					<p className="text-sm text-muted-foreground">
						Your document will always be used as context for the agent.
					</p>
				</div>
				<Button
				onClick={handleSave}
				variant="outline"
				className="cursor-pointer"
				
				>
				{isSaving ? (
					<Loader2 className="animate-spin h-4 w-4" />
				) : (
					"Save"
				)}
				</Button>
			</div>

        
			{/* Editor */}
			<div className="w-full px-6 flex-1 rounded-xl flex flex-col min-h-0">
			{loadingDoc || !editor ? (
				<LoadingOverlay text="Loading document..." />
			) : (
				<div className="flex-1 overflow-auto bn-editor">
					<BlockNoteView
						editor={editor}
						className="w-full h-full flex-1"
					/>
				</div>
			)}
			</div>

        {/* Chat Interface */}
        {/* <div className="flex-1 min-h-0">
				<ChatInterface
					projectId={project?.project_id}
					sessionId={project?.plannerSessionId}
					onSendMessage={handleSendMessage}
					sending={sending}
				/>
				</div> */}
      </div>

      {/* Right Column - App Preview */}
      {/* <div className="w-1/2 flex flex-col min-h-0">
				<div className="p-6 border-border flex-shrink-0">
					<div className="flex items-center justify-between">
						<div>
						<h2 className="text-xl font-semibold text-foreground mb-1">
							Product Document
						</h2>
						<p className="text-sm text-muted-foreground">
							Review your product document
						</p>
						</div>
						<Button size="sm" variant="outline" className="gap-2">
						<Play className="w-4 h-4" />
						Run
						</Button>
					</div>
				</div> */}

      {/* Document text editor */}
      {/* <div className="flex-1 p-6 min-h-0">
					<div className="w-full h-full">
						<BlockNoteView editor={editor} className="w-full h-full"
						/>
					</div>
				</div>
			</div> */}
    </div>
  );
}

export default ProductPlanningPage;
