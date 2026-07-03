/* eslint-disable */
// MessageComponentRegistry.tsx
import { createElement } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolCallGroup } from "./ToolCallGroup";
import { ErrorBanner } from "./ErrorBanner";
import Integration from "./Integration";
import { TaskList } from './TaskList';
import { FinalAnswer } from './FinalAnswer';
import { ComponentType, StreamComponent } from '../lib/util/types/stream-component';
import { BuildProgress } from './BuildProgress';
import { SupabaseMigration } from './SupabaseMigration';
import { DeployProgress } from './DeployProgress';
 
// Message component type definition
export type MessageComponent = {
  type: string;
  props: Record<string, any>;
};

// Text component implementations
function TextMessageComponent({ content, isStreaming, animationDelay }: any) {
  return (
    <div className="text-base leading-relaxed w-full max-w-full break-words">
      {content}
    </div>
  );
}

function MarkdownMessageComponent({ content, isStreaming, animationDelay }: any) {
  return (
    <div className="text-base leading-relaxed w-full max-w-full break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function FinalAnswerComponent({ content, isStreaming, animationDelay }: any) {
  return (
    <div className="text-base leading-relaxed w-full max-w-full break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function OutputMessageComponent({ content, isStreaming, animationDelay }: any) {
  return (
    <div className="text-base leading-relaxed w-full max-w-full break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function ErrorComponent({ message, isStreaming, animationDelay }: any) {
  return <ErrorBanner message={message} />;
}

export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  [ComponentType.TEXT]: TextMessageComponent,
  [ComponentType.MARKDOWN]: MarkdownMessageComponent,
  [ComponentType.FINAL_ANSWER]: FinalAnswerComponent,
  [ComponentType.BUILD_PROGRESS]: BuildProgress,
  [ComponentType.SUPABASE_MIGRATION]: SupabaseMigration,
  [ComponentType.DEPLOY_PROGRESS]: DeployProgress,
  //[ComponentType.TOOL_CALL]: ToolCallComponent,
  [ComponentType.TOOL_GROUP]: ToolCallGroup,
  [ComponentType.PROGRESS_UPDATE]: OutputMessageComponent,
  [ComponentType.TASK_LIST]: TaskList,
  [ComponentType.INTEGRATION]:  Integration,
  [ComponentType.ERROR]: ErrorComponent,
};

// Registry renderer component
interface ComponentRendererProps {
  component: StreamComponent;
  isStreaming?: boolean;
  animationDelay?: number;
}

export function ComponentRenderer({ 
  component, 
  isStreaming = false, 
  animationDelay = 0 
}: ComponentRendererProps) {
  //console.log("IN COMPONENT RENDERER", component)
  const Component = ComponentRegistry[component.type];
  //console.log("COMPONENT PICKED", Component)
  
  if (!Component) {
    console.warn(`Unknown component type: ${component.type}`);
    return (
      <div className="text-sm text-muted-foreground w-full max-w-full break-words">
        Unknown component: {component.type}
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-full">
      {createElement(Component, {
        ...component.props,
        isStreaming,
        animationDelay,
      })}
    </div>
  );
}