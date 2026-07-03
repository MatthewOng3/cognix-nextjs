import SupabaseIntegrationLogin from "@/app/components/integrations/supabase/SupabaseIntegrationLogin";

export const IntegrationRegistry = {
	supabase: {
		steps: [
			//Prompt user to login through supabase and authorize Cognix
			{
				id: "auth",
				component: SupabaseIntegrationLogin,
				// onComplete: async (data: any) => {
				// 	// Exchange code for token, store in DB, etc.
				// },
			},
			//Add confirmation component into chat interface 
			//Show things like displaying 
			// {
			// 	id: "fetch-data",
			// 	component: SupabaseStep2,
			// 	// onComplete: async () => {
			// 	// 	// Fetch org/projects etc
			// 	// },
			// },
		],
	},
  };
  
export type IntegrationType = keyof typeof IntegrationRegistry;

  
export type IntegrationStepProps = {
	projectId: string;
	serviceName: string;
	threadId: string;
	chatSessionId: string;
	currentStep: number;
	nextStep: (data: any) => void;
};

  
export type IntegrationManagerProps = {
  serviceName: IntegrationType
  status: string;
  projectId: string;
  threadId: string;
  chatSessionId: string;
  createdAt: string;
  currentStep: number;
//   // Injected by parent Chat UI to avoid nested hooks refetching
//   addMessage: (message: ChatMessageObj) => void;
};