# Integration System Usage Guide

## Overview

This integration system provides a clean, extensible way to handle different integration flows (Supabase, Stripe, GitHub, etc.) without complex if-else chains. It uses a registry pattern and event-driven architecture.

## How It Works

### 1. Backend AI Server Events

When your AI server determines an integration is needed, it sends these events:

```typescript
// When integration is required
{
  type: "integration_required",
  data: {
    integrationType: "supabase",
    flow: {
      id: "supabase",
      name: "Supabase",
      description: "Database and authentication backend",
      steps: [...],
      estimatedTime: "2-3 minutes"
    },
    totalSteps: 5,
    message: "I need to set up Supabase for your database needs"
  },
  timestamp: "2024-01-01T00:00:00.000Z"
}

// For each step
{
  type: "integration_step",
  data: {
    integrationType: "supabase",
    stepIndex: 1,
    totalSteps: 5,
    currentStep: {
      id: "get_credentials",
      title: "Get API credentials",
      description: "Copy your project URL and anon key",
      type: "config",
      required: true
    }
  },
  timestamp: "2024-01-01T00:00:00.000Z"
}

// When complete
{
  type: "integration_complete",
  data: {
    integrationType: "supabase",
    message: "Supabase integration completed successfully!"
  },
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### 2. Frontend Integration

The frontend automatically handles these events and shows the appropriate integration flow UI.

## Adding New Integrations

### Step 1: Create Integration Flow

Add your integration to `flows.ts`:

```typescript
export const INTEGRATION_FLOWS: Record<IntegrationType, IntegrationFlow> = {
  // ... existing integrations
  myNewService: {
    id: "myNewService",
    name: "My New Service",
    description: "Description of what this service does",
    icon: "🔧",
    category: "api",
    estimatedTime: "1-2 minutes",
    steps: [
      {
        id: "auth",
        title: "Authenticate",
        description: "Sign up or sign in",
        type: "auth",
        required: true,
        data: {
          url: "https://myservice.com/signup",
          action: "signup"
        }
      },
      // ... more steps
    ]
  }
};
```

### Step 2: Create Integration Component

Create `MyNewServiceIntegration.tsx`:

```typescript
"use client";

import type { IntegrationComponentProps } from "../../lib/util/types/integration";

export default function MyNewServiceIntegration(props: IntegrationComponentProps) {
  // Your custom integration UI logic here
  return (
    <div>
      {/* Custom UI for your integration */}
    </div>
  );
}
```

### Step 3: Register Integration

In `IntegrationManager.tsx`, register your integration:

```typescript
registerIntegration({
  type: "myNewService",
  component: MyNewServiceIntegration,
  validator: (data) => {
    // Validate the integration data
    return !!(data.apiKey && data.secret);
  },
  onComplete: async (data) => {
    // Save integration data to backend
    await fetch('/api/integrations/myNewService', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
});
```

## Backend AI Server Integration

### Example: Supabase Integration Trigger

```python
# In your AI server
def determine_integration_needs(user_message, project_context):
    if "database" in user_message.lower() or "auth" in user_message.lower():
        return {
            "type": "integration_required",
            "data": {
                "integrationType": "supabase",
                "flow": get_supabase_flow(),
                "totalSteps": 5,
                "message": "I'll help you set up Supabase for your database and authentication needs."
            }
        }
    return None

def get_supabase_flow():
    return {
        "id": "supabase",
        "name": "Supabase",
        "description": "Database and authentication backend",
        "icon": "🗄️",
        "category": "database",
        "estimatedTime": "2-3 minutes",
        "steps": [
            # ... step definitions
        ]
    }
```

## Benefits

1. **No Complex If-Else**: Registry pattern eliminates need for complex conditional logic
2. **Extensible**: Easy to add new integrations without modifying existing code
3. **Reusable**: Integration components can be reused across different parts of the app
4. **Type-Safe**: Full TypeScript support with proper type checking
5. **User-Friendly**: Step-by-step guided flows with progress indicators
6. **Flexible**: Supports different integration types (auth, config, test, complete)

## Event Flow

1. AI server determines integration needed
2. Sends `integration_required` event with flow definition
3. Frontend shows integration modal with step-by-step UI
4. User completes each step
5. AI server receives step completion events
6. Final `integration_complete` event closes the flow
7. Integration data is saved to backend

This system scales well and makes it easy to add new integrations without touching existing code.
