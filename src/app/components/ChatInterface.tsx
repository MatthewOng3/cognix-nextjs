import { Loader2, RefreshCw, Send } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch, useStore } from "react-redux";
import { ChatActionsProvider } from "@/app/components/ChatActionsContext";
import { StreamingStatusRail } from "@/app/components/LiveActivityIndicator";
import { MessageRenderer } from "@/app/components/MessageRenderer";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Textarea } from "@/app/components/ui/textarea";
import { useSendMessageMutation } from "@/app/lib/redux/api/chatApi";
import type {
  ChatMessageObj,
  StreamingState,
} from "@/app/lib/redux/features/chatSlice";
import { useTypewriter } from "@/app/lib/util/functions/typewriter";
import { useChat } from "../hooks/use-chat";
import { setShowOutOfCreditsModal } from "../lib/redux/features/creditSlice";
import type { RootState } from "../lib/redux/store";
import {
  MessageRateLimiter,
  validateMessageContent,
} from "../lib/securityUtils";
import { TypingIndicator } from "./TypingIndicator";

interface ChatInterfaceProps {
  projectId: string;
  sessionId: string;
  useStreaming?: boolean;
  descriptionHeader: string;
  descriptionBody: string;
  svgImage: React.ReactNode;
  plannerAgent: boolean; //True if using chat interface to converse with planner agent as opposed to regular build agent
  sendMessageHandler?: (content: string) => Promise<void>; //Idea is to make it so outside components pass in customized send message functions if needed
}

const STREAMING_STATUS_DEBUG = false;
const STREAMING_STATUS_DEBUG_STAGE: StreamingState["currentStatus"] = "deploying";

/**
 * @description Chat interface component for a chat session instance
 * @param projectId - The ID of the project
 * @param sessionId - The ID of the chat session
 * @param useStreaming - Whether to use streaming messages (default: true)
 * @param descriptionHeader - Header text for empty state
 * @param descriptionBody - Body text for empty state
 * @param svgImage - SVG image for empty state
 * @returns The chat interface component
 */
export function ChatInterface({
  projectId,
  sessionId,
  useStreaming = true,
  descriptionHeader,
  descriptionBody,
  svgImage,
  sendMessageHandler,

  plannerAgent = false,
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Reference to the scroll area
  const messagesEndRef = useRef<HTMLDivElement>(null); // Reference to the messages end
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Reference to the textarea
  const [inputValue, setInputValue] = React.useState(""); // State for the input value
  const [textareaHeight, setTextareaHeight] = React.useState(40); // State for textarea height
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );

  // Rate limiter instance (persists across renders)
  const rateLimiterRef = useRef(new MessageRateLimiter(10, 60000)); // 10 messages per minute

  const dispatch = useDispatch();
  const store = useStore<RootState>();

  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    streamingState,
    isProductChatLoading,
    sendStreamingMessage,
  } = useChat({ sessionId, limit: 20, projectId });

  const effectiveStreamingState = STREAMING_STATUS_DEBUG
    ? {
        ...streamingState,
        isStreaming: true,
        currentStatus: STREAMING_STATUS_DEBUG_STAGE,
      }
    : streamingState;

  // RTK Query mutation for non-streaming messages
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();

  // Constants for textarea sizing
  const MIN_HEIGHT = 40; // Minimum height in pixels
  const MAX_HEIGHT = 200; // Maximum height in pixels

  // Auto-resize textarea based on content
  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto"; // Reset height to recalculate
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(
        Math.max(scrollHeight, MIN_HEIGHT),
        MAX_HEIGHT,
      );
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Auto-resize when input value changes
  useEffect(() => {
    if (inputValue.trim() === "") {
      // Reset to minimum height when input is empty
      setTextareaHeight(MIN_HEIGHT);
    } else {
      resizeTextarea();
    }
  }, [inputValue, resizeTextarea]);

  // Reset height when input is cleared
  useEffect(() => {
    if (inputValue.trim() === "") {
      setTextareaHeight(MIN_HEIGHT);
      if (textareaRef.current) {
        textareaRef.current.style.height = `${MIN_HEIGHT}px`;
      }
    }
  }, [inputValue]);

  const lastMessageKey =
    messages.at(-1)?.message_id ??
    messages.at(-1)?.created_at ??
    String(messages.length);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    void lastMessageKey;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageKey]);

  // Auto-scroll when tool calls are added during streaming
  useEffect(() => {
    if (streamingState.isStreaming) {
      // Find the streaming message and get its component count
      const streamingMessage = messages.find(
        (msg) => msg.message_id === streamingState.streamingMessageId,
      );
      if (streamingMessage?.components) {
        // Scroll when tool calls are added
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [streamingState.isStreaming, streamingState.streamingMessageId, messages]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = event.currentTarget;

      // Load more when user scrolls to top (within 100px)
      if (scrollTop < 100 && hasMore && !loadingMore) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loadMore],
  );

  /**
   * @description Handle the send message event
   */
  async function handleSendMessage() {
    // 1. SANITIZE HERE INSTEAD OF ON CHANGE
    // Note: If users need to send HTML code snippets (like <div>),
    // DOMPurify might strip them. Consider removing this if the
    // backend/LLM needs raw code input.
    // Clear any previous validation errors
    setValidationError(null);

    // 1. Validate message content
    const validation = validateMessageContent(inputValue);
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid message");
      return;
    }

    // 2. Check rate limiting
    if (!rateLimiterRef.current.canSendMessage()) {
      const remainingTime = Math.ceil(
        rateLimiterRef.current.getRemainingTime() / 1000,
      );
      setValidationError(
        `Too many messages. Please wait ${remainingTime} seconds.`,
      );
      return;
    }

    //console.log(store.getState().user.userData.credit_balance)
    //Credit check
    if (store.getState().user.userData.credit_balance <= 0) {
      dispatch(setShowOutOfCreditsModal(true));
      return;
    }

    const inputContent = inputValue;

    //Reset input value and textarea height immediately
    setInputValue("");
    setTextareaHeight(MIN_HEIGHT);

    //If sending a message to planner agent
    if (plannerAgent && sendMessageHandler) {
      await sendMessageHandler(inputContent);
      //await sendPlannerMessage(inputContent, productDoc)
    }
    // Use the appropriate message sending method for builder agent
    else if (useStreaming) {
      await sendStreamingMessage(inputContent, false);
    } else {
      // Use RTK Query mutation for non-streaming messages
      try {
        await sendMessage({
          sessionId,
          projectId,
          content: inputContent,
          isPrd: false,
        }).unwrap();
      } catch (error) {
        console.error("Failed to send message:", error);
        setValidationError("Failed to send message. Please try again.");
        // Restore input on error
        setInputValue("");
      }
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === "Enter" && event.shiftKey) {
      // Allow shift+enter to create new lines (default behavior)
    }
    // Allow shift+enter to create new lines (default behavior)
  };

  // Clear validation error when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  // Stable callback for child components (e.g. DeployProgress "Fix this error") to send messages
  const handleComponentSendMessage = useCallback(
    async (content: string, skipUserMessage?: boolean) => {
      if (useStreaming) {
        await sendStreamingMessage(
          content,
          false,
          null,
          false,
          skipUserMessage,
        );
      }
    },
    [useStreaming, sendStreamingMessage],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-6"
        onScroll={handleScroll}
      >
        {/* Load More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading more messages...
            </span>
          </div>
        )}

        {/* Messages */}
        <ChatActionsProvider sendMessage={handleComponentSendMessage}>
          <div className="space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-8">
                {/* <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" /> */}
                {svgImage}
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {descriptionHeader}
                  {/* Start Building with AI */}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {descriptionBody}
                  {/* Ask me to create anything - from simple components to full
						applications. I'll help you build it step by step. */}
                </p>
              </div>
            )}

            {/*Individual message component*/}
            {messages.map((message, index) => (
              <ChatMessageItem
                key={message.message_id || `message-${index}`}
                message={message}
                streamingState={streamingState}
              />
            ))}

            {/* Typing indicator for planner agent */}
            {plannerAgent && isProductChatLoading && <TypingIndicator />}
          </div>
        </ChatActionsProvider>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 flex-shrink-0 relative">
        <div className="rounded-[26px] border border-border/70 bg-background/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          {!plannerAgent &&
            (effectiveStreamingState.isStreaming ||
              effectiveStreamingState.currentStatus !== "idle" ||
              isProductChatLoading ||
              sendingMessage) && (
              <div className="-mx-3 -mt-3 mb-3">
                <StreamingStatusRail
                  className="rounded-b-none border-x-0 border-t-0 shadow-none"
                  currentStatus={
                    isProductChatLoading
                      ? "thinking"
                      : sendingMessage
                        ? "idle"
                        : effectiveStreamingState.currentStatus
                  }
                />
              </div>
            )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Message anything"
                className="pl-10 pr-4 bg-muted border-border resize-none"
                disabled={
                  streamingState.isStreaming ||
                  sendingMessage ||
                  (plannerAgent && isProductChatLoading)
                }
                style={{
                  height: `${textareaHeight}px`,
                  minHeight: `${MIN_HEIGHT}px`,
                  maxHeight: `${MAX_HEIGHT}px`,
                  overflowY: textareaHeight >= MAX_HEIGHT ? "auto" : "hidden",
                }}
              />
              <Send className="absolute left-3 top-3 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={
                !inputValue.trim() ||
                streamingState.isStreaming ||
                sendingMessage
              }
              size="sm"
              className="cognix-gradient !text-black hover:opacity-90 cursor-pointer"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChatMessageItemProps {
  message: ChatMessageObj;
  streamingState: StreamingState;
}

/**
 * @description Chat message item component in chat interface
 * @param message - The message object
 * @returns The chat message item component
 */
function ChatMessageItem({ message, streamingState }: ChatMessageItemProps) {
  const displayedText = useTypewriter(
    message?.content ?? "",
    6,
    message.is_typewriter,
  );

  if (message.hidden) {
    return null;
  }
  //console.log("IN CHAT MESSAGE ITEM", message)
  const isUser = message.role === "User"; //Check role of message sent

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <Code className="w-4 h-4 text-accent-foreground" />
        </div>
      )} */}

      <div
        className={
          isUser
            ? "flex-1 flex flex-col items-end max-w-[85%] min-w-0"
            : "flex-1 flex flex-col items-start max-w-[85%] min-w-0"
        }
      >
        <div
          className={
            isUser
              ? "bg-slate-600 text-white rounded-lg p-3 w-full wrap-break-word overflow-hidden"
              : "bg-chat-background rounded-lg p-3 w-full wrap-break-word overflow-hidden"
          }
        >
          {isUser ? (
            <div className="text-sm wrap-break-word overflow-wrap-anywhere">
              {displayedText}
            </div>
          ) : (
            <MessageRenderer
              content={message.content}
              components={message.components ?? []}
              isTypewriter={message.is_typewriter}
              displayedText={displayedText}
              isStreaming={message.is_streaming || false}
              currentStatus={streamingState.currentStatus}
            />
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {!isUser && (
            <p className="text-xs font-medium text-foreground">Cognix</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatTimeAgo(new Date(message.created_at))}
          </p>
        </div>
      </div>

      {/*User Text below chat bubble*/}
      {/* {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-white">User</span>
        </div>
      )} */}
    </div>
  );
}

// Helper to format time ago
function formatTimeAgo(date: Date) {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
