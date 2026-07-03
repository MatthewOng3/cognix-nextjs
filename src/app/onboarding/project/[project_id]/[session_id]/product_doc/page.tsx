/* eslint-disable */

"use client";

import { Info, Loader2 } from "lucide-react";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ChatInterface } from "@/app/components/ChatInterface";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { Button } from "@/app/components/ui/button";
import { useOnboarding } from "@/app/hooks/use-onboarding";
import { useProject } from "@/app/hooks/use-project";
import "@blocknote/mantine/style.css";
import AiProjManager from "../../../../../../../public/project_manager.png";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { Project } from "@/app/lib/util/supabase/types/tables";
import { handleSaveBlocks } from "@/app/lib/api/blocknote";
import { useChat } from "@/app/hooks/use-chat";
import { defaultDocument } from "@/app/project/[project_id]/plan/defaultDocument";

export type GeneratePrdResponse = {
  message_id: string;
  product_markdown_doc: string | null;
  chat_session_id: string;
  role: "User" | "AI";
  content: string;
  created_at: string;
};

// Allows any subset of ProjectData fields to be updated
export type ProjectUpdateData = Partial<Project> & { project_id: string };


/**
 * @description Onboarding page where users can converse with product AI agent to create and modify product requirements document. 
 * @route onboarding/project/[project_id]/[session_id]/product_doc
 * @returns
 */
export default function ProductDocPage() {
    const pathName = usePathname();
    const router = useRouter();
    const dispatch = useDispatch();
    const params = useParams<{ project_id: string, session_id: string }>();
    const projectId = params.project_id;
    const sessionId = params.session_id;
    
     // ✅ Memoize to stabilize these values
    const stableProjectId = useMemo(() => projectId, [projectId]);
    const stableSessionId = useMemo(() => sessionId, [sessionId]);

    // hooks
    const { saveOnboardingState, isUserOnboardingComplete } = useOnboarding();
    const { activeProject, fetchProjectInfo, isFetchLoaded, setFetchLoading } = useProject();
    const { sendPlannerMessage } = useChat({ sessionId: stableSessionId, limit: 20, projectId: stableProjectId });
    
    // states
    const [isLoading, setLoading] = useState(false);
 
    const chatSessionId = activeProject?.plannerSessionId;

    // BlockNote editor
    const editor = typeof window !== "undefined"
    ? useCreateBlockNote({ initialContent: defaultDocument })
    : null;
    
 
    // fetch project info if needed
    useEffect(() => {
        if (!activeProject?.projectId  && projectId) {
            fetchProjectInfo(projectId);
        }
    }, [projectId, activeProject?.projectId]);
 


    useEffect(() => {
        /**
         * @description Function to update block note editor to reflect latest redux state, as AI server will modify it. 
         */
        async function updateEditor() {
            if (activeProject?.productDocMarkdown && editor) {
                const blocks = await editor.tryParseMarkdownToBlocks(
                    activeProject.productDocMarkdown
                );
                editor.replaceBlocks(editor.document, blocks);
                dispatch(setFetchLoading(false))
            }
        }
        updateEditor();
    }, [activeProject?.productDocMarkdown, editor]);
    
 
    /**
     * @description Continue to build page to trigger first build
     */
    async function continueHandler() {
        if (!projectId || !editor) return;
        setLoading(true);
        const markdown = await editor.blocksToMarkdownLossy(editor.document)
        //Save document states to backend
        await handleSaveBlocks(editor.document, markdown, projectId);

        //If part of user first onboarding, updates onboarding state and moves to next step
        if (!isUserOnboardingComplete && activeProject?.plannerSessionId) {
            await saveOnboardingState(pathName, {
                plannerSessionId: activeProject?.plannerSessionId,
                projectId: activeProject?.projectId,
            });
        }

        // Trim and check if document has actual content
        const hasContent = markdown.trim().length > 0;

        // Trigger build route with or without ?new_project=true
        if (hasContent) {
            router.replace(`/project/${projectId}/build?new_project=true`);
        } else {
            router.replace(`/project/${projectId}/build`);
        }
        setLoading(false);
    }

 
    // Show loading overlay if loading or if generated prd in active project data is false
    if (!activeProject?.projectId) {
        return <LoadingOverlay text="Loading Product Manager AI.." />;
    }

    return (
        <div className="flex h-screen w-full gap-2 items-center bg-gradient-to-br from-[#7e5bef] via-gray-200 to-gray-100 px-5">
          {/* Left = Chat */}
            <div className="w-1/2 flex flex-col p-6 border-r overflow-hidden h-10/12 bg-background rounded-2xl shadow-md">
                <div className="flex-shrink-0 mb-4">
                    <label className="block text-lg font-semibold mb-2 text-white">
                        Build your product vision document
                    </label>
                <div className="flex items-start bg-muted/10 border border-muted rounded-md p-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 mr-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        Describe your product idea to the Product AI agent will turn it into a structured
                        product vision document for your project which will be used as additional context for coding!
                    </p>
                </div>
                </div>
    
                <div className="flex-1 min-h-0">
                <ChatInterface
                    plannerAgent={true}
                    projectId={projectId ?? ""}
                    sessionId={chatSessionId ?? ""}
                    sendMessageHandler={async (content) => {

                        if(!editor)return
                        const markdown = await editor.blocksToMarkdownLossy(editor.document);
                        await sendPlannerMessage(content, markdown);
                    }}
                    
                    useStreaming={false}
                    descriptionHeader="Hi! I'm your AI product manager"
                    descriptionBody="Tell me what you need to build and I will draft your PRD. You can edit it anytime in the right panel."
                    svgImage={
                    <Image
                        src={AiProjManager}
                        alt="Illustration"
                        className="w-14 h-20 text-muted-foreground mx-auto mb-4"
                    />
                    }
                />
                </div>
            </div>
    
            {/* Right = PRD Editor */}
            <div className="w-1/2 flex flex-col p-6 h-10/12 rounded-2xl bg-background">
                <div className="  rounded-2xl p-4 flex flex-col h-full ">
                    <div className="flex-shrink-0 mb-4">
                        <label className="text-2xl font-semibold text-white mb-2">
                            Product Requirements Document
                        </label>
                        <div className="flex items-start bg-gray-700/50 rounded-md p-3 mt-2">
                            <Info className="w-5 h-5 text-primary mt-0.5 mr-2 shrink-0" />
                            <p className="text-sm text-white">
                            Click the Start Building button once you feel the document is clear enough as 
                            this first draft will be used as the first input for the coding agent. 
                            You can always edit this anytime later!
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden rounded-xl relative">
                    {editor && (
                        <BlockNoteView
                            editor={editor}
                            className="w-full h-full flex-1 overflow-auto"
                        />
                    )}
                        { (isLoading || isFetchLoaded) && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
                                <div className="flex flex-col items-center">
                                    <Loader2 className="animate-spin h-8 w-8 text-white mb-2" />
                                    <span className="text-white text-sm">
                                    Generating Product Requirements Document...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        {/* <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gradient-to-r cursor-pointer from-[#7e5bef]/10 to-[#ec4899]/10 text-[#7e5bef] border border-[#7e5bef]/40 hover:from-[#7e5bef]/20 hover:to-[#ec4899]/20"
                        >
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
                        </Button> */}
                        <Button
                            onClick={continueHandler}
                            disabled={isLoading}
                            className="cognix-gradient text-white cursor-pointer"
                        >
                            Start Building
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      );
}
