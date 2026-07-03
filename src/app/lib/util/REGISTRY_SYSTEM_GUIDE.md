# Registry-Based Message System Guide

## Overview

This system allows you to create rich, interactive chat messages using a registry-based approach while maintaining backward compatibility with the existing tool call system.

## Key Components

### 1. ComponentRenderer (`/components/ComponentRenderer.tsx`)
- **Purpose**: Central registry that maps component types to React components
- **Registry**: Contains all available component types (text, tool_group, integration, etc.)
- **Renderer**: Takes a `MessageComponent` and renders the appropriate component

### 2. MessageRenderer (`/components/MessageRenderer.tsx`) 
- **Purpose**: Main message rendering component with dual support
- **Legacy Support**: Still works with `ToolCallComponent[]` 
- **New Support**: Uses `MessageComponent[]` for registry-based rendering
- **Segmentation**: Same logic as before - groups tool calls, breaks at messages/errors

### 3. Migration Utilities (`/lib/util/messageMigration.ts`)
- **Purpose**: Helper functions to convert between old and new formats
- **Functions**: `migrateToolCallsToComponents()`, `createIntegrationMessage()`, etc.

## How It Works

### Current System (Legacy)
```typescript
// Input: ToolCallComponent[]
const legacyInput = [
  { name: "output_message", value: "I'll help you..." },
  { name: "create_file", value: "src/App.tsx" },
  { name: "edit_file", value: "src/index.ts" },
  { name: "final_answer", value: "Done!" }
];

// MessageRenderer processes this into segments:
// 1. Message: "I'll help you..."
// 2. ToolGroup: [create_file, edit_file] 
// 3. Message: "Done!"
```

### New Registry System
```typescript
// Input: MessageComponent[]
const registryInput = [
  { type: 'output_message', props: { content: "I'll help you..." } },
  { type: 'tool_group', props: { toolCalls: [...] } },
  { type: 'integration', props: { serviceName: 'supabase', ... } },
  { type: 'final_answer', props: { content: "Done!" } }
];

// ComponentRenderer renders each component directly
```

## Usage Examples

### Basic Text Message
```typescript
const textMessage: MessageComponent[] = [
  {
    type: 'output_message',
    props: { content: 'Hello, I can help you with that!' }
  }
];
```

### Tool Operations
```typescript
const toolMessage: MessageComponent[] = [
  {
    type: 'tool_group',
    props: {
      toolCalls: [
        { name: 'create_file', value: 'src/App.tsx' },
        { name: 'search_codebase', value: 'React patterns' }
      ]
    }
  }
];
```

### Integration Flow
```typescript
const integrationMessage: MessageComponent[] = [
  {
    type: 'output_message',
    props: { content: 'Setting up Supabase integration...' }
  },
  {
    type: 'tool_group',
    props: {
      toolCalls: [
        { name: 'create_file', value: 'src/lib/supabase.ts' }
      ]
    }
  },
  {
    type: 'integration',
    props: {
      serviceName: 'supabase',
      projectId: 'proj_123',
      chatSessionId: 'session_456',
      currentStep: 0,
      status: 'pending'
    }
  },
  {
    type: 'final_answer',
    props: { content: 'Click the button above to configure!' }
  }
];
```

### Migration from Legacy
```typescript
// Convert existing ToolCallComponent[] to MessageComponent[]
const legacyToolCalls: ToolCallComponent[] = [
  { name: "output_message", value: "Creating files..." },
  { name: "create_file", value: "src/App.tsx" },
  { name: "final_answer", value: "Done!" }
];

const newComponents = migrateToolCallsToComponents(legacyToolCalls);
```

## Integration with ChatInterface

### Current Usage (No Changes Needed)
```typescript
// In ChatInterface.tsx - this still works exactly the same
<MessageRenderer
  content={message.content}
  messageComponent={message.message_component} // Legacy support
  isTypewriter={message.is_typewriter}
  displayedText={displayedText}
  isStreaming={message.is_streaming || false}
  currentStatus={streamingState.currentStatus}
/>
```

### New Usage (Optional)
```typescript
// Add support for new registry format
<MessageRenderer
  content={message.content}
  messageComponent={message.message_component} // Legacy support
  messageComponents={message.message_components} // New registry support
  isTypewriter={message.is_typewriter}
  displayedText={displayedText}
  isStreaming={message.is_streaming || false}
  currentStatus={streamingState.currentStatus}
/>
```

## Adding New Component Types

### 1. Create the Component
```typescript
// components/custom-components/ChartComponent.tsx
export function ChartComponent({ data, title, isStreaming, animationDelay }: any) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
        Chart: {JSON.stringify(data)}
      </div>
    </div>
  );
}
```

### 2. Add to Registry
```typescript
// In ComponentRenderer.tsx
import { ChartComponent } from './custom-components/ChartComponent';

export const MessageComponentRegistry: Record<string, React.ComponentType<any>> = {
  // ... existing components
  'chart': ChartComponent,
};
```

### 3. Use the Component
```typescript
const chartMessage: MessageComponent[] = [
  {
    type: 'chart',
    props: {
      title: 'Project Statistics',
      data: { files: 15, lines: 1200, commits: 8 }
    }
  }
];
```

## Benefits

1. **Backward Compatibility**: Existing code continues to work
2. **Extensibility**: Easy to add new component types
3. **Reusability**: Components can be reused across different contexts
4. **Type Safety**: Better TypeScript support with proper prop typing
5. **Maintainability**: Each component type has its own logic
6. **Interactive Elements**: Support for buttons, forms, charts, etc.

## Migration Strategy

1. **Phase 1**: Deploy with backward compatibility (current state)
2. **Phase 2**: Gradually migrate existing messages to new format
3. **Phase 3**: Add new interactive components as needed
4. **Phase 4**: Eventually deprecate legacy format (optional)

The system is designed to be completely backward compatible, so you can start using the new registry components immediately without breaking existing functionality.
