/* eslint-disable */

"use client";

import { Code, MessageSquare, FileText, Network, ExternalLink, Github } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { ChatInterface } from "@/app/components/ChatInterface";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { Button } from "@/app/components/ui/button";
import { useProject } from "@/app/hooks/use-project";
import { NEW_PROJECT_PARAM } from "@/app/project/constants";
import { ChatMessageObj } from "@/app/lib/redux/features/chatSlice";
import { useSupabaseChannel } from "@/app/hooks/use-supabase-channel";
import { useAlert } from "@/app/components/AlertNotif";
import { useChat } from "@/app/hooks/use-chat";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { handleSaveBlocks } from "@/app/lib/api/blocknote";
import { defaultDocument } from "@/app/project/[project_id]/plan/defaultDocument";
import "@blocknote/mantine/style.css";
import Image from "next/image";
import AiProjManager from "../../../../../public/project_manager.png";
import { useDispatch, useSelector, useStore } from "react-redux";
import { RootState } from "@/app/lib/redux/store";
import { OutOfCreditsModal } from "@/app/components/OutOfCredit";
import { setShowOutOfCreditsModal } from "@/app/lib/redux/features/creditSlice";
import { PreviewIframe } from "@/app/components/PreviewIframe";
import { PublishButton } from "@/app/components/PublishButton";



type ViewMode = "builder" | "planner";
type RightPanelMode = "preview" | "document" | "architecture";

/**
 * @description AI builder page where user chats with the builder-agent.
 * @route project/[project_id]/build
 * @returns
 */
function AIBuilderPage() {
	const router = useRouter();
	const dispatch = useDispatch();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const isNewProject =
		(searchParams.get(NEW_PROJECT_PARAM) ?? "false") === "true";

	const [sentInitialMsg, setSentInitialMsg] = useState<boolean>(false);
	const { showAlert } = useAlert();
	const [iframeKey, setIframeKey] = useState(0);

	// Default to 'builder' for all projects
	const [viewMode, setViewMode] = useState<ViewMode>("builder");
	const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("preview");
	const [updatingDocument, setUpdatingDocument] = useState<boolean>(false); // NEW: Loading state for document updates
	const showCreditModelState = useSelector(
		(state: RootState) => state.credit.showOutOfCreditsModal
	);

	// Get project state using custom hook
	const { activeProject, isFetchLoaded, previewUrl, refreshKey } = useProject();
	const [sending, setSending] = useState(false);
	
	const projectId = useMemo(
		() => activeProject?.projectId ?? null,
		[activeProject],
	);
	const sessionId = useMemo(
		() => activeProject?.builderSessionId ?? null,
		[activeProject],
	);
	const plannerSessionId = useMemo(
		() => activeProject?.plannerSessionId ?? null,
		[activeProject],
	);
	const productDoc = useMemo(
		() => activeProject?.productDocMarkdown ?? null,
		[activeProject],
	);
	const architectureDoc = useMemo(
		() => activeProject?.architectureDoc ?? null,
		[activeProject],
	);
	const lastDeployedAt = useMemo(
		() => activeProject?.lastDeployedAt ?? null,
		[activeProject],
	)
	const prodUrl = useMemo(
		() => activeProject?.prodUrl ?? null,
		[activeProject],
	)
	// Builder chat hook
	const {
		messages,
		loading,
		streamingState,
		sendStreamingMessage,
		resetStreaming,
		sendManualMessage,
		handleDeploymentUpdate
	} = useChat({
		projectId: projectId!,
		sessionId: sessionId!,
	});

	//====== Web container logic
	// const {
	// 	status: webContainerStatus,
	// 	error: webContainerError,
	// 	previewUrl: webContainerPreviewUrl,
	// 	previewStatus: webContainerPreviewStatus,
	// 	deployProject: deployToWebContainer,
	// 	openPreviewInNewTab,
	// } = useWebContainer();

	// console.log("WEB CONTAINER PREVIEW URL", webContainerPreviewUrl)

	// // Deploy on mount
	// useEffect(() => {
	// 	if (projectId && viewMode === "builder") {
	// 		console.log("🚀 Deploying to WebContainer...");
	// 		deployToWebContainer({ projectId });
	// 	}
	// }, [projectId, viewMode, deployToWebContainer]);

	// Planner chat hook
	const { sendPlannerMessage } = useChat({
		sessionId: plannerSessionId!,
		limit: 20,
		projectId: projectId!
	});

	// BlockNote editor for PRD
	const editor = typeof window !== "undefined"
		? useCreateBlockNote({ initialContent: defaultDocument })
		: null;

	// Update editor when productDocMarkdown changes
	useEffect(() => {
		async function updateEditor() {
			if (activeProject?.productDocMarkdown && editor) {
				setUpdatingDocument(true); // Start loading
				try {
					const blocks = await editor.tryParseMarkdownToBlocks(
						activeProject.productDocMarkdown
					);
					editor.replaceBlocks(editor.document, blocks);

					// Optional: Show success notification
					if (rightPanelMode === "document") {
						showAlert("Document updated", "success");
					}
				} catch (error) {
					console.error("Error updating document:", error);
					showAlert("Error updating document", "error");
				} finally {
					setUpdatingDocument(false); // End loading
				}
			}
		}
		updateEditor();
	}, [activeProject?.productDocMarkdown, editor]);

	// Listen for integration completion broadcasts from integration completion
	useEffect(() => {
		if (!sessionId) return;
		let channel: BroadcastChannel | null = null;
		try {
			channel = new BroadcastChannel("cognix-integration");
			channel.onmessage = (event) => {
				const data = event.data as { type?: string; threadId?: string | null, message?: string };

				//Broadcast message sent from integration complete window
				if(data?.type === "integration_complete"){
					//AI message object
					const aiCompletionMessage:ChatMessageObj = {
						chat_session_id: sessionId,
						content: data.message ?? "",
						created_at: new Date().toISOString(),
						is_streaming: false,
						role: "AI",
						is_typewriter:true
					}

					//Dispatch message from AI signaling completed (local tab)
					sendManualMessage(aiCompletionMessage);

					// Restart the builder with the original user prompt after OAuth completes.
					void (async () => {
						try {
							if (!data.threadId) {
								await handleSendMessage("Continue building", false, null, false, true);
								return;
							}

							const response = await fetch(
								`/api/chat/thread/${data.threadId}/original-prompt`,
							);
							const result = (await response.json()) as {
								success?: boolean;
								data?: { content?: string };
							};

							const originalPrompt = result?.data?.content?.trim();

							await handleSendMessage(
								originalPrompt || "Continue building",
								false,
								null,
								false,
								true,
							);
						} catch (error) {
							console.error("Failed to resume builder after integration:", error);
							await handleSendMessage("Continue building", false, null, false, true);
						}
					})();
				}
			};
		} catch(e){
			console.log("BroadcastChannel not available", e);
		}
		return () => {
			if(channel){
				channel.close();
			}
		};
	}, [sessionId]);


	/**
	 * @description Show indication of deployment outcome and cancel refreshing preview spinner by updating streaming state
	 * @param payload Currently only project deployment schema but in future we want this to be dynamic
	 */
	function handleRefreshingPreview(payload: any) {
		//Show indication to user if app preview deployment to dokku worked or not
		if (payload.is_successful) {
			// 🔄 Force iframe to reload by bumping key (causes React to remount it)
			setIframeKey(prev => prev + 1);
			showAlert("App Preview Refreshed Successfully", "success")
		}
		else {
			showAlert("Error deploying to dokku server", "error")
		}
		handleDeploymentUpdate(payload)
	}

	// ==== Handles setting up a channel to get real time updates on project deployments ==== 
	// LEGACY, when using github action for preview updates
	//useSupabaseChannel(activeProject?.projectId, handleRefreshingPreview);

	// Show loading overlay
	if (isFetchLoaded || !activeProject) {
		return <LoadingOverlay text="Loading..." />;
	}

	/**
	 * @description Handle the send message event using streaming for the builder chat
	 * @param content - The content of the message
	 * @param isPrd - Whether this is a production request
	 * @param threadId Stable run identifier for the builder flow
	 * @param resumeFromCheckpoint Whether to continue from an existing checkpoint
	 * @param skipMessage Flag indicating to ignore user sent message. 
	 */
	async function handleSendMessage(
		content: string,
		isPrd: boolean = false,
		threadId?: string | null,
		resumeFromCheckpoint: boolean = false,
		skipMessage: boolean = false,
	): Promise<void> {
		if (!skipMessage && !content.trim()) return;
		setSending(true);
		resetStreaming();

		try {
			await sendStreamingMessage(
				content,
				isPrd,
				threadId ?? null,
				resumeFromCheckpoint,
				skipMessage,
			);
		} catch (error) {
			console.error(error);
		} finally {
			setSending(false);
		}
	}

	/**
	 * @description Handle planner message send
	 */
	async function handlePlannerSendMessage(content: string): Promise<void> {
		if (!editor) return;
		const markdown = await editor.blocksToMarkdownLossy(editor.document);
		await sendPlannerMessage(content, markdown);
	}

	/**
	 * @description Save PRD document
	 */
	async function handleSaveDocument() {
		if (!projectId || !editor) return;
		const markdown = await editor.blocksToMarkdownLossy(editor.document);
		await handleSaveBlocks(editor.document, markdown, projectId);
		showAlert("Document saved successfully", "success");
	}

	/**
	 * @description Launch preview app deployed as a docker image on dokku server in a new tab
	 * on user browser.
	 */
	async function showPreview() {
		if (!previewUrl) {
			showAlert("No preview url found", "error");
			return;
		}
		window.open(previewUrl, "_blank");
	}

	// Auto-send initial prompt for new projects from the prompt project creation
	const initialMsgSentRef = React.useRef(false);
	useEffect(() => {
		if (isNewProject && !initialMsgSentRef.current && sessionId) {
			const initialPrompt = searchParams.get("prompt");

			if (initialPrompt) {
				console.log("🚀 Auto-sending initial prompt:", initialPrompt);
				// Mark as sent immediately to strict mode double-invocation
				initialMsgSentRef.current = true;
				handleSendMessage(initialPrompt);
				setSentInitialMsg(true);

				// Strip query params so a page reload won't re-fire the prompt
				router.replace(pathname, { scroll: false });
			}
		}
	}, [isNewProject, sessionId, searchParams]);

	// Show message if no chat session is available
	if (!activeProject?.builderSessionId) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center">
					<Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
					<p className="text-muted-foreground mb-4">
						No builder chat session found for this project.
					</p>
					<p className="text-sm text-muted-foreground mb-4">
						This might happen if the project was created without chat sessions.
					</p>
					<Button onClick={() => router.push("/project")} variant="outline">
						Back to Projects
					</Button>
				</div>
			</div>
		);
	}
 
	// Switch right panel mode based on view mode
	useEffect(() => {
		if (viewMode === "builder") {
			setRightPanelMode("preview");
		} else {
			setRightPanelMode("document");
		}
	}, [viewMode]);

	function handleOpenCreditChange(open: boolean) {
		dispatch(setShowOutOfCreditsModal(open));
	}
	
	/**
	 * @description Sends a deployment error into the builder chat so the AI can fix it.
	 */
	function handleSendErrorToChat(errorMessage: string): void {
		handleSendMessage(errorMessage, false, null, false);
	}

	return (
		<div className="h-full flex flex-col">
			{/* Top Navigation Tabs */}
			<div className="bg-background px-6 py-3 shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						<button
							onClick={() => setViewMode("planner")}
							className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${viewMode === "planner"
								? "bg-primary/10 text-primary font-medium"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
								}`}
						>
							<MessageSquare className="w-4 h-4" />
							Planner
						</button>
						<button
							onClick={() => setViewMode("builder")}
							className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${viewMode === "builder"
								? "bg-primary/10 text-primary font-medium"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
								}`}
						>
							<Code className="w-4 h-4" />
							Builder
						</button>
					</div>

					{/* {viewMode === "builder" && (
						<Button
							size="sm"
							className="cognix-gradient !text-black hover:opacity-90 transition-opacity cursor-pointer"
							onClick={showPreview}
						>
							<SquareArrowOutUpRight className="w-4 h-4 mr-0.5" />
							Preview
						</Button>
					)} */}
					{/* ── Top-right action buttons ── */}
					{viewMode === "builder" && (
						<div className="flex items-center gap-2">
							{/* Redesigned Preview button */}
							<button
								onClick={showPreview}
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
											transition-all duration-150 hover:bg-foreground/4 cursor-pointer border"
								style={{
									borderColor: "var(--border)",
									background: "var(--surface-raised)",
        							color: "var(--muted-foreground)",
								}}
								>
								<ExternalLink className="w-3.5 h-3.5" />
								Preview
							</button>

							<button
								type="button"
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
											transition-all duration-150 hover:bg-foreground/4 cursor-pointer border"
								style={{
									borderColor: "var(--border)",
									background: "var(--surface-raised)",
									color: "var(--muted-foreground)",
								}}
							>
								<Github className="w-3.5 h-3.5" />
								Export
							</button>
 
							{/* Publish button with dropdown */}
							<PublishButton
								projectId={projectId ?? ""}
								chatSessionId={sessionId ?? ""}
								initialDeployedUrl={prodUrl}
								initialLastPublishedAt={lastDeployedAt}
								onSendErrorToChat={handleSendErrorToChat} //Send message to AI
							/>
						</div>
					)}
				</div>
			</div>
			{
				showCreditModelState
				&&
				<OutOfCreditsModal onOpenChange={handleOpenCreditChange} open={showCreditModelState} />
			}
			<div className="flex-1 flex min-h-0 bg-muted">
				{/* Left Column - AI Chat Section */}
				<div className="w-1/2 flex flex-col min-h-0">
				
					{/* Left Column - Header */}
					{/* <div className="p-6 border-b border-border flex-shrink-0">
						<h1 className="text-xl font-semibold text-foreground mb-2">
							{viewMode === "builder" ? "AI Builder" : "AI Product Manager"}
						</h1>
						<p className="text-sm text-muted-foreground">
							{viewMode === "builder" 
								? "Chat with AI to build your application"
								: "Refine your product vision and requirements"
							}
						</p>
					</div> */}

					{/* Chat Interface */}
					<div className="flex-1 min-h-0 flex flex-col">
						<div className="flex-1 min-h-0">
							{viewMode === "builder" ? (
								<ChatInterface
									projectId={projectId ?? ""}
									sessionId={sessionId ?? ""}
									useStreaming={true}
									plannerAgent={false}
									descriptionBody="From idea to full-stack code. Just chat and create."
									descriptionHeader="Start Building your dream app with AI"
									svgImage={
										<Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									}
								/>
							) : (
								<ChatInterface
									plannerAgent={true}
									projectId={projectId ?? ""}
									sessionId={plannerSessionId ?? ""}
									sendMessageHandler={handlePlannerSendMessage}
									useStreaming={false}
									descriptionHeader="Hi! I'm your AI product manager"
									descriptionBody="Discuss your product idea with me and I can help you refine it and build your Product Requirements Document. This will help assist the builder agent."
									svgImage={
										<Image
											src={AiProjManager}
											alt="Illustration"
											className="w-14 h-20 text-muted-foreground mx-auto mb-4"
										/>
									}
								/>
							)}
						</div>
					</div>
				</div>

				{/* Right Column - Dynamic Content */}
				<div className="w-2/3 flex flex-col min-h-0">
					{rightPanelMode === "preview" ? (
						<div className="flex-1 min-h-0 p-4">
							<div className="w-full h-full rounded-2xl overflow-hidden border border-border bg-background">
								<PreviewIframe
									projectId={activeProject.projectId}
 									src={activeProject.previewUrl ?? "http://example-nonexistent-url"} // your deployed app URL
 									refreshKey={refreshKey}
 								/>
							</div>
						</div>
					) : (
						<>
							<div className="p-6 shrink-0">
								<div className="flex items-center justify-between flex-row mb-2">
									<div>
										<h2 className="text-xl font-semibold text-foreground mb-1">
											{rightPanelMode === "document"
												? "Product Requirements Document"
												: "Architecture Diagram"
											}
										</h2>
										<p className="text-m font-medium text-foreground">
											{rightPanelMode === "document"
												? "A clear blueprint of product goals, features, and user workflows for more accurate app implementation. Builder agent will be able to refer to this document."
												: "Visual representation of your system"
											}
										</p>
									</div>
								</div>

								{/* Tabs for Planner view */}
								{viewMode === "planner" && (
									<div className="flex items-center justify-between">
										<div className="flex gap-1">
											<button
												onClick={() => setRightPanelMode("document")}
												className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${rightPanelMode === "document"
													? "bg-primary/10 text-primary font-medium"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
													}`}
											>
												<FileText className="w-4 h-4" />
												Document
											</button>
											<button
												onClick={() => setRightPanelMode("architecture")}
												className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${rightPanelMode === "architecture"
													? "bg-primary/10 text-primary font-medium"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
													}`}
											>
												<Network className="w-4 h-4" />
												Architecture
											</button>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="cursor-pointer"
											onClick={handleSaveDocument}
										>
											Save Document
										</Button>
									</div>
								)}
							</div>

							{/* Content Area */}
							<div className="flex-1 p-6 min-h-0">
								<div className="relative w-full h-full bg-muted rounded-lg border border-border overflow-hidden">
									{rightPanelMode === "document" && editor && (
										<div className="relative w-full h-full">
											{updatingDocument && (
												<LoadingOverlay
													text="Updating document…"
													fullScreen={false}
												/>
											)}
											<div className="w-full h-full overflow-auto bg-[#1e1e1e]">
												<BlockNoteView
													editor={editor}
													className="h-full"
												/>
											</div>
										</div>
									)}
									{rightPanelMode === "architecture" && (
										<div className="relative w-full h-full">
											{!architectureDoc && streamingState.isStreaming && (
												<LoadingOverlay
													text="Generating architecture…"
													fullScreen={false}
												/>
											)}
											{!architectureDoc && !streamingState.isStreaming && (
												<div className="w-full h-full flex items-center justify-center">
													<div className="text-center">
														<Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
														<h3 className="text-lg font-medium text-foreground mb-2">
															Architecture Document
														</h3>
														<p className="text-sm text-muted-foreground max-w-md">
															No architecture document yet. It will appear when code is generated.
														</p>
													</div>
												</div>
											)}
											{architectureDoc && (
												<div className="w-full h-full overflow-auto bg-[#1e1e1e] p-6">
													<div className="prose prose-invert prose-sm max-w-none">
														<ReactMarkdown remarkPlugins={[remarkGfm]}>
															{architectureDoc}
														</ReactMarkdown>
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default AIBuilderPage;
