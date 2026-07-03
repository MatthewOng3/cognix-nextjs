"use client";

import { createContext, useContext } from "react";

interface ChatActions {
  sendMessage: (content: string, skipUserMessage?: boolean) => Promise<void>;
}

const ChatActionsContext = createContext<ChatActions | null>(null);

export function ChatActionsProvider({
  sendMessage,
  children,
}: ChatActions & { children: React.ReactNode }) {
  return (
    <ChatActionsContext.Provider value={{ sendMessage }}>
      {children}
    </ChatActionsContext.Provider>
  );
}

export function useChatActions(): ChatActions | null {
  return useContext(ChatActionsContext);
}
