export type IntegrationType = "supabase" | "stripe" | "github" | "vercel" | "openai";

export type IntegrationStep = {
  id: string;
  title: string;
  description: string;
  type: "auth" | "config" | "test" | "complete";
  required: boolean;
  data?: Record<string, unknown>;
};

export type IntegrationFlow = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  steps: IntegrationStep[];
  estimatedTime: string;
  category: "database" | "payment" | "auth" | "deployment" | "ai";
};

export type IntegrationEvent = {
  type: "integration_required" | "integration_step" | "integration_complete";
  data: {
    integrationType: IntegrationType;
    flow?: IntegrationFlow;
    currentStep?: IntegrationStep;
    stepIndex?: number;
    totalSteps?: number;
    message?: string;
    actionRequired?: boolean;
    nextAction?: string;
  };
  timestamp: string;
};

export type IntegrationHandler = {
  type: IntegrationType;
  component: React.ComponentType<IntegrationComponentProps>;
  validator?: (data: Record<string, unknown>) => boolean;
  onComplete?: (data: Record<string, unknown>) => Promise<void>;
};

export type IntegrationComponentProps = {
  flow: IntegrationFlow;
  currentStep: IntegrationStep;
  stepIndex: number;
  totalSteps: number;
  onNext: (stepData: Record<string, unknown>) => void;
  onBack: () => void;
  onComplete: (finalData: Record<string, unknown>) => void;
  onCancel: () => void;
};
