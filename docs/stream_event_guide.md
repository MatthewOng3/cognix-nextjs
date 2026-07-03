# Stream Event Handler System - Developer Guide

## Overview

This system uses the **Strategy Pattern** to handle different types of streaming events from the AI server. Each event type has its own dedicated handler class, making the code more maintainable, testable, and extensible.

## Architecture

### Key Components

1. **StreamEventHandler Interface**: Base interface all handlers implement
2. **StreamEventContext**: Context object passed to handlers containing dispatch, state getters, etc.
3. **StreamEventHandlerRegistry**: Central registry that maps event types to handlers
4. **Handler Classes**: Individual classes for each event type

## How to Add a New Event Type

### Step 1: Define the Event Type

Add your new event type to the `StreamEvent` type union:

```typescript
export type StreamEvent = {
  type:
    | "status_update"
    | "tool_call_start"
    // ... existing types
    | "my_new_event"  // ← Add your new event type here
    | "error";
  data: Record<string, unknown>;
  timestamp: string;
};
```

### Step 2: Create a Handler Class

Create a new handler class that implements `StreamEventHandler`:

```typescript
/**
 * Handler for my_new_event events
 */
class MyNewEventHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    // Extract data from event
    const myData = event.data.myField as string;
    
    // Access current state if needed
    const currentState = context.getCurrentStreamingState();
    const currentMessages = context.getCurrentMessages();
    
    // Dispatch actions to update Redux state
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          // Your state updates here
          customField: myData,
        },
      })
    );
    
    // Or add a new message
    const newMessage: ChatMessageObj = {
      chat_session_id: context.sessionId,
      role: "AI",
      content: myData,
      created_at: new Date().toISOString(),
      message_id: crypto.randomUUID(),
      // ... other fields
    };
    
    context.dispatch(
      addMessage({ sessionId: context.sessionId, message: newMessage })
    );
  }
}
```

### Step 3: Register the Handler

Add your handler to the registry in the constructor:

```typescript
export class StreamEventHandlerRegistry {
  constructor() {
    // ... existing registrations
    this.register("my_new_event", new MyNewEventHandler());
  }
}
```

That's it! Your new event type will now be automatically handled.

## Complete Example: Adding a "Code Review" Event

Let's say you want to add a new event type for code reviews from the AI.

### 1. Add the Event Type

```typescript
export type StreamEvent = {
  type:
    | "status_update"
    | "code_review_start"
    | "code_review_complete"
    | "error";
  data: Record<string, unknown>;
  timestamp: string;
};
```

### 2. Create Handler Classes

```typescript
/**
 * Handler for code_review_start events
 */
class CodeReviewStartHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const fileName = event.data.file_name as string;
    
    // Update streaming state
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: "reviewing",
          reviewingFile: fileName,
        },
      })
    );
    
    // Add a message showing review started
    const reviewMessage: ChatMessageObj = {
      chat_session_id: context.sessionId,
      role: "AI",
      content: `Starting code review for ${fileName}...`,
      created_at: new Date().toISOString(),
      message_id: `review-start-${Date.now()}`,
      is_streaming: true,
      is_typewriter: false,
    };
    
    context.dispatch(
      addMessage({ sessionId: context.sessionId, message: reviewMessage })
    );
  }
}

/**
 * Handler for code_review_complete events
 */
class CodeReviewCompleteHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const reviewResults = event.data.results as {
      issues: number;
      suggestions: string[];
    };
    
    const currentState = context.getCurrentStreamingState();
    
    // Update the streaming message with results
    if (currentState.streamingMessageId) {
      context.dispatch(
        updateMessage({
          sessionId: context.sessionId,
          messageId: currentState.streamingMessageId,
          updates: {
            content: `Code review complete. Found ${reviewResults.issues} issues.`,
            is_streaming: false,
            message_component: {
              type: "codeReview",
              props: reviewResults,
            },
          },
        })
      );
    }
    
    // Reset streaming state
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: "idle",
          reviewingFile: null,
        },
      })
    );
  }
}
```

### 3. Register the Handlers

```typescript
export class StreamEventHandlerRegistry {
  constructor() {
    // ... existing registrations
    this.register("code_review_start", new CodeReviewStartHandler());
    this.register("code_review_complete", new CodeReviewCompleteHandler());
  }
}
```

## Advanced Patterns

### Shared Logic Between Handlers

If multiple handlers share logic, extract it into helper methods or utility classes:

```typescript
// Utility class for common operations
class StreamEventUtils {
  static createStreamingMessage(
    sessionId: string,
    content: string
  ): ChatMessageObj {
    return {
      chat_session_id: sessionId,
      role: "AI",
      content,
      created_at: new Date().toISOString(),
      message_id: `streaming-${Date.now()}`,
      is_streaming: true,
      is_typewriter: false,
      hidden: false,
    };
  }
}

// Use in handlers
class MyHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const message = StreamEventUtils.createStreamingMessage(
      context.sessionId,
      "Some content"
    );
    context.dispatch(addMessage({ sessionId: context.sessionId, message }));
  }
}
```

### Conditional Handler Registration

You can conditionally register handlers based on feature flags:

```typescript
export class StreamEventHandlerRegistry {
  constructor(featureFlags?: { enableCodeReview?: boolean }) {
    // Always register core handlers
    this.register("status_update", new StatusUpdateHandler());
    
    // Conditionally register feature handlers
    if (featureFlags?.enableCodeReview) {
      this.register("code_review_start", new CodeReviewStartHandler());
      this.register("code_review_complete", new CodeReviewCompleteHandler());
    }
  }
}
```

### Handler Composition

For complex handlers, you can compose them:

```typescript
class CompositeHandler implements StreamEventHandler {
  constructor(
    private handlers: StreamEventHandler[]
  ) {}
  
  handle(event: StreamEvent, context: StreamEventContext): void {
    for (const handler of this.handlers) {
      handler.handle(event, context);
    }
  }
}

// Usage
this.register(
  "complex_event",
  new CompositeHandler([
    new UpdateStateHandler(),
    new NotifyUserHandler(),
    new LogEventHandler(),
  ])
);
```

## Testing

Each handler can be easily unit tested in isolation:

```typescript
describe("CodeReviewStartHandler", () => {
  it("should update streaming state and add message", () => {
    const mockDispatch = jest.fn();
    const mockContext: StreamEventContext = {
      sessionId: "test-session",
      dispatch: mockDispatch,
      getCurrentStreamingState: () => ({ /* mock state */ }),
      getCurrentMessages: () => [],
    };
    
    const event: StreamEvent = {
      type: "code_review_start",
      data: { file_name: "App.tsx" },
      timestamp: new Date().toISOString(),
    };
    
    const handler = new CodeReviewStartHandler();
    handler.handle(event, mockContext);
    
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining("setStreamingState"),
      })
    );
  });
});
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each handler does one thing well
2. **Easy to Extend**: Add new event types without modifying existing code
3. **Testable**: Each handler can be tested in isolation
4. **Type-Safe**: TypeScript ensures type safety across the system
5. **Maintainable**: Clear structure makes code easy to understand and modify
6. **Reusable**: Handlers can be reused or composed for complex scenarios

## Debugging Tips

### Enable Handler Logging

Add logging to understand handler execution:

```typescript
export class StreamEventHandlerRegistry {
  handle(event: StreamEvent, context: StreamEventContext): void {
    console.log(`[StreamEvent] Handling: ${event.type}`, event.data);
    
    const handler = this.get(event.type);
    if (handler) {
      handler.handle(event, context);
      console.log(`[StreamEvent] Completed: ${event.type}`);
    } else {
      console.warn(`No handler registered for event type: ${event.type}`);
    }
  }
}
```

### Debug Individual Handlers

Wrap handlers with debugging decorator:

```typescript
class DebugHandler implements StreamEventHandler {
  constructor(
    private handler: StreamEventHandler,
    private eventType: string
  ) {}
  
  handle(event: StreamEvent, context: StreamEventContext): void {
    console.log(`[${this.eventType}] Starting...`);
    try {
      this.handler.handle(event, context);
      console.log(`[${this.eventType}] Success`);
    } catch (error) {
      console.error(`[${this.eventType}] Error:`, error);
      throw error;
    }
  }
}

// Usage
this.register(
  "my_event",
  new DebugHandler(new MyEventHandler(), "my_event")
);
```

## Migration from Old Code

To migrate from the old switch-case pattern:

1. Create this new file structure
2. Test the new handlers alongside old code
3. Gradually migrate event types to new handlers
4. Once all events are migrated, remove old code
5. Update imports in use-chat hook

The new system is backward compatible, so you can migrate incrementally.