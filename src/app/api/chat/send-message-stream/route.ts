import axios, { HttpStatusCode } from "axios";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseToolCallValue } from "@/app/lib/util/llm/tool-utils";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ToolCallComponent } from "@/app/lib/util/supabase/types/tables";
import { withAuth } from "@/app/lib/api/withAuth";
import { envConfig } from "@/app/lib/util/env-config";
import { ApiResponse } from "@/app/lib/util/types/api";
import { StreamEvent } from "@/app/lib/util/stream-event-handlers";
 
import { ComponentType, createComponent, StreamComponent } from "@/app/lib/util/types/stream-component";


//Data type taht frontend expects to be streamed
// export type StreamEvent = {
//   type:
//     | "status_update"
//     | "ai_message_start"
//     | "ai_message_token"
//     | "ai_message_complete"
//     | "tool_call_start"
//     | "tool_call_token"
//     | "tool_call_complete"
//     | "build_start"
//     | "build_complete"
//     | "deploy_start"
//     | "deploy_complete"
//     | "integration_required"
//     | "integration_step"
//     | "integration_complete"
//     | "final_response"
//     | "error";
//   data: Record<string, unknown>;
//   timestamp: string;
// };

const postBody = z.object({
  content: z.string(),
  projectId: z.string(),
  sessionId: z.string(),
  isPrd: z.boolean().default(false),
  skipUserMessage: z.boolean().default(false),
  threadId: z.string().nullable().optional().default(null),
  resumeFromCheckpoint: z.boolean().default(false),
});

// Tool call parsing utilities
interface ToolCallTracker {
  name: string;
  args: Record<string, unknown>;
  tokens: string[];
  flushed?: boolean; // Track if added to a group already
}

// Configuration for tool calls to omit from database storage
const OMITTED_TOOL_CALLS = new Set(["coder_agent"]);

// Tools that trigger a group flush
const GROUP_BOUNDARY_TOOLS = new Set([
	"final_answer",
	"progress_update",
	"request_user_input",
	"error",
]);

// Declarative mapping from stream event types to saveable components.
// To add a new event type, just add an entry here — no new if-conditions needed.
// Events sharing a `key` update the same component (e.g. deploy_start creates it, deploy_complete updates it).
interface EventComponentMapping {
	componentType: ComponentType;
	extractProps: (data: Record<string, unknown>) => Record<string, unknown>;
	key?: string;
}

const EVENT_COMPONENT_MAP: Record<string, EventComponentMapping> = {
	build_start: {
		componentType: ComponentType.BUILD_PROGRESS,
		extractProps: () => ({ status: "building", message: "Compiling your application..." }),
		key: "build",
	},
	build_complete: {
		componentType: ComponentType.BUILD_PROGRESS,
		extractProps: (data) => ({
			status: data.success !== false ? "success" : "failed",
			message: data.message || (data.success !== false ? "Build completed successfully" : "Build failed"),
			buildOutput: data.success !== false ? data.buildOutput : undefined,
			error: data.success === false ? data.error : undefined,
		}),
		key: "build",
	},
	push_supabase_migration_start: {
		componentType: ComponentType.SUPABASE_MIGRATION,
		extractProps: (data) => ({
			status: "pushing",
			message: data.message || "Pushing Supabase migration...",
		}),
		key: "supabase_migration",
	},
	push_supabase_migration_end: {
		componentType: ComponentType.SUPABASE_MIGRATION,
		extractProps: (data) => ({
			status: data.success !== false ? "success" : "failed",
			message: data.message || (data.success !== false ? "Migration pushed successfully" : "Migration failed"),
			error: data.success === false ? data.error : undefined,
		}),
		key: "supabase_migration",
	},
	deploy_start: {
		componentType: ComponentType.DEPLOY_PROGRESS,
		extractProps: (data) => ({
			status: "deploying",
			message: data.message || "Deploying your application...",
		}),
		key: "deploy",
	},
	deploy_complete: {
		componentType: ComponentType.DEPLOY_PROGRESS,
		extractProps: (data) => ({
			status: data.success !== false ? "success" : "failed",
			message: data.message || (data.success !== false ? "Deployed successfully" : "Deployment failed"),
		}),
		key: "deploy",
	},
	deploy_error: {
		componentType: ComponentType.DEPLOY_PROGRESS,
		extractProps: (data) => ({
			status: "failed",
			message: data.message || "Deployment failed",
			error: data.error || data.message || "Deployment failed",
		}),
		key: "deploy",
	},
	integration_required: {
		componentType: ComponentType.INTEGRATION,
		extractProps: (data) => ({ integrationProps: data.props }),
	},
	generating_tasks_completed: {
		componentType: ComponentType.TASK_LIST,
		extractProps: (data) => ({
			tasks: data.task_list,
			totalTasks: Array.isArray(data.task_list) ? (data.task_list as unknown[]).length : 0,
		}),
	},
	final_answer: {
		componentType: ComponentType.FINAL_ANSWER,
		extractProps: (data) => ({
			content: data.content,
			agent: data.agent,
		}),
	},
};

function parseIncompleteJson(tokens: string[]): Record<string, unknown> {
  if (tokens.length === 0) return {};

  try {
    return JSON.parse(tokens.join("")) as Record<string, unknown>;
  } catch {
    // Handle incomplete JSON gracefully - return empty object
    return {};
  }
}

/**
 * Create component from completed tool call
 * @param name Tool name
 * @param args Tool arguments
 */
function createComponentFromTool(
	name: string,
	args: Record<string, unknown>,
	toolId: string
  ): StreamComponent | null {
	// Special tools that get their own component types
	switch (name) {
	  case "final_answer":
		return createComponent(
		  ComponentType.FINAL_ANSWER,
		  {
			content: String(args.summary || args.message || ""),
			agent: String(args.agent || "unknown"),
		  },
		  { toolCallId: toolId }
		);
  
	  case "progress_update":
		return createComponent(
		  ComponentType.PROGRESS_UPDATE,
		  {
			content: String(args.update || ""),
		  },
		  { toolCallId: toolId }
		);
  
	//   case "request_user_input":
	// 	return createComponent(
	// 	  ComponentType.USER_INPUT,
	// 	  {
	// 		prompt: String(args.prompt || args.message || ""),
	// 		inputType: String(args.input_type || "text"),
	// 	  },
	// 	  { toolCallId: toolId }
	// 	);
  
	  case "error":
		return createComponent(
		  ComponentType.ERROR,
		  {
			message: String(args.message || "An error occurred"),
			code: String(args.code || ""),
			details: args.details,
		  },
		  { toolCallId: toolId }
		);
  
	  // Regular tool calls - return null, they'll be grouped
	  default:
		return null;
	}
}

/**
 * @description Opens a stream connection with client on build page, acccepts user message
 * and requests AI server with the message to kick off the AI agent process. 
 * @route api/chat/send-message-stream
 */
export const POST = withAuth(async (request: NextRequest) => {
	const supabase = createSupabaseAdminClient();
	
	try {
		// === VALIDATION ===
		const body = postBody.safeParse(await request.json());
		if (body.error) {
			return NextResponse.json({
				type: "error",
				data: { message: "Missing required fields" },
			});
		}
  
		const {
			content,
			projectId,
			sessionId,
			isPrd,
			threadId,
			skipUserMessage,
			resumeFromCheckpoint,
		} = body.data;
		//Since thread id might be pre populated to continue from an existing thread
		const resolvedThreadId = threadId ?? crypto.randomUUID();
	
		// === PROJECT & USER VALIDATION ===
		const { data: projectData, error: projectError } = await supabase
			.from("project")
			.select("user_id")
			.eq("project_id", projectId)
			.single();
	
		if (projectError || !projectData) {
			return NextResponse.json(
				{ type: "error", data: { message: "Project not found" } },
				{ status: 404 }
			);
		}
	
		const user_id = projectData.user_id;
		
		const { data: user_credit } = await supabase
			.from("user")
			.select("credit_balance")
			.eq("user_id", user_id)
			.single();
		
		// user_credit is an object like { credit_balance: 25 }
		if (!user_credit || user_credit.credit_balance <= 0) {
			console.log("Insufficient credits in builder agent");
			return NextResponse.json({
				success: false,
				data: { type: "insufficient-credits" },
				error: "Insufficient credits"
			});
		}
  
		// === PRD VALIDATION ===
		const { data: messages } = await supabase
		.from("chat_history")
		.select("message_id")
		.eq("chat_session_id", sessionId);
		
		const hasPreviousMessages = (messages?.length ?? 0) > 0;
		
		if (isPrd && hasPreviousMessages) {
			return NextResponse.json(
				{
					type: "error",
					data: { message: "Unable to send PRD after other messages have been sent." },
				},
				{ status: HttpStatusCode.BadRequest }
			);
		}
		
		// === SAVE USER MESSAGE ===
		//We skip for certain cases like the continuing stuff after user signs up to third party integration
		if (!skipUserMessage) {
			const { error } = await supabase
			.from("chat_history")
			.insert({
				content,
				chat_session_id: sessionId,
				role: "User",
				thread_id: resolvedThreadId,
				created_at: new Date().toISOString(),
			})
			.select()
			.single();
			
			if (error) {
				return NextResponse.json(
					{ type: "error", data: { message: "Failed to save message" } },
					{ status: 500 }
				);
			}
		}
  
	  // === STREAMING SETUP ===
	  const encoder = new TextEncoder();
	  const aiServerUrl = envConfig.aiServerUrl;
  
	  if (!aiServerUrl) {
		return NextResponse.json(
		  { type: "error", data: { message: "AI server configuration missing" } },
		  { status: 500 }
		);
	  }
  
	  // === CREATE STREAM ===
	  const stream = new ReadableStream({
		async start(controller) {
			const sendEvent = (event: StreamEvent) => {
				const data = `data: ${JSON.stringify(event)}\n\n`;
				controller.enqueue(encoder.encode(data));
			};
  
			// State management
			const components: StreamComponent[] = [];
			const activeToolCalls = new Map<string, ToolCallTracker>();
			const componentKeyMap = new Map<string, number>(); // tracks keyed component indices for updates
			let currentToolGroup: Array<{
				name: string;
				args: Record<string, unknown>;
				result: string;
			}> = [];
			
			//Flush tool group as a tool group component, grouping tool calls
			const flushToolGroup = () => {
				if (currentToolGroup.length > 0) {
				const toolGroupComponent = createComponent(
					ComponentType.TOOL_GROUP,
					{ toolCalls: [...currentToolGroup] }
				);
				components.push(toolGroupComponent);
				currentToolGroup = [];
				}
			};
			
			//Save components to database
			const saveToDb = async () => {
				flushToolGroup();
				if (components.length > 0) {
					await supabase.from("chat_history").insert({
						content: null,
						chat_session_id: sessionId,
						role: "AI",
						created_at: new Date().toISOString(),
						components: components,
						thread_id: resolvedThreadId
					});
				}
			};
			// Single try-catch for the entire stream operation
			try {
				// === FETCH STREAM ===
				const response = await fetch(
				`${aiServerUrl}/api/builder-agent/stream`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Accept": "text/event-stream",
					},
					body: JSON.stringify({
						thread_id: resolvedThreadId,
						resume_from_checkpoint: resumeFromCheckpoint,
						message: content,
						project_id: projectId,
						chat_session_id: sessionId,
						user_id,
						use_planner: isPrd,
					}),
				}
				);
	
				if (!response.ok || !response.body) {
					throw new Error(`AI server request failed: ${response.statusText}`);
				}
	
				// === PROCESS STREAM ===
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
	
				while (true) {
					const { done, value } = await reader.read();
					
					if (done) {
						console.log("Stream completed normally");
						break;
					}
		
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";
		
					for (const line of lines) {
						if (!line.startsWith("data: ") || line.length <= 6) continue;
		
						const jsonString = line.slice(6).trim();
						if (!jsonString) continue;
		
						// Parse event - skip individual malformed events, don't crash
						let eventData;
						try {
							eventData = JSON.parse(jsonString);
						} catch (e) {
							console.error("Skipping malformed SSE event:", line.slice(0, 100));
							continue; // Skip this event, process others
						}
		
						// === EVENT PROCESSING ===
						if (eventData.type === "tool_call_start") {
							const { tool_id, tool_name, tool_args } = eventData.data;
							if (tool_id && tool_name && !OMITTED_TOOL_CALLS.has(tool_name)) {
								activeToolCalls.set(tool_id, {
								name: tool_name,
								args: tool_args || {},
								tokens: [],
								flushed: false,
								});
							}
						} 
						else if (eventData.type === "tool_call_token") {
							const { tool_id, token } = eventData.data;
							const tracker = activeToolCalls.get(tool_id);
							if (tracker && token) {
								tracker.tokens.push(token);
							}
						}
						else if (eventData.type === "tool_call_complete") {
							const toolId = eventData.data.tool_id;
							const tracker = activeToolCalls.get(toolId);
			
							if (tracker && !tracker.flushed) {
								let finalArgs = tracker.args;
								if (tracker.tokens.length > 0) {
								const tokenArgs = parseIncompleteJson(tracker.tokens);
								finalArgs = { ...tracker.args, ...tokenArgs };
								}
			
								if (GROUP_BOUNDARY_TOOLS.has(tracker.name)) {
									flushToolGroup();
									const specialComponent = createComponentFromTool(
										tracker.name,
										finalArgs,
										toolId
									);
									if (specialComponent) {
										components.push(specialComponent);
									}
								} else {
								currentToolGroup.push({
									name: tracker.name,
									args: finalArgs,
									result: parseToolCallValue(tracker.name, finalArgs),
								});
								}
								tracker.flushed = true;
								activeToolCalls.delete(toolId);
							}
						} 
						else {
							// Generic component creation from EVENT_COMPONENT_MAP
							const mapping = EVENT_COMPONENT_MAP[eventData.type];
							if (mapping) {
								flushToolGroup();
								const props = mapping.extractProps(eventData.data);
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic dispatch, map ensures correctness
								const component = createComponent(mapping.componentType as any, props as any);

								if (mapping.key) {
									// Keyed/stateful component — update existing or create new
									const existingIndex = componentKeyMap.get(mapping.key);
									if (existingIndex !== undefined) {
										components[existingIndex] = component;
									} else {
										components.push(component);
										componentKeyMap.set(mapping.key, components.length - 1);
									}
								} else {
									// Stateless — always create new component
									components.push(component);
								}
							}
						}
		
						// Forward to client
						sendEvent({
							type: eventData.type,
							data: eventData.data,
							timestamp: new Date().toISOString(),
						});
						console.log("[app/api/chat/send-message-stream] Event sent to frontend", eventData.type, "[Event Data] :: ", eventData.data);
					}
				}
	
				// Success - save and close
				await saveToDb();
				sendEvent({
					type: "stream_end",
					data: {},
					timestamp: new Date().toISOString(),
				});
				
			} catch (error) {
				// Handle ANY error in the stream process
				console.error("Stream error:", error);
				
				flushToolGroup();
				components.push(
				createComponent(ComponentType.ERROR, {
					message: error instanceof Error ? error.message : "AI stopped responding",
				})
				);
				
				await saveToDb();
				
				sendEvent({
					type: "error",
					data: { 
						message: error instanceof Error ? error.message : "Streaming error occurred" 
					},
					timestamp: new Date().toISOString(),
				});
			} finally {
				controller.close();
			}
		},
	});
  
	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
  
	} catch (error) {
	  // Top-level error (validation, DB setup, etc.)
	  console.error("Server error:", error);
	  return NextResponse.json(
		{ type: "error", data: { message: "Internal server error" } },
		{ status: 500 }
	  );
	}
  });
