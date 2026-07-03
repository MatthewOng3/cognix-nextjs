/* eslint-disable */
"use client";
import { IntegrationManagerProps, IntegrationRegistry, IntegrationStepProps } from "../lib/util/types/integration-component";
 
// Register integration handlers
// registerIntegration({
//   type: "supabase",
//   component: SupabaseIntegration,
//   validator: (data) => {
//     return !!(data.url && data.anonKey);
//   },
//   onComplete: async (data) => {
//     // Save integration data to backend
//     console.log("Supabase integration completed:", data);
//   },
// });

/**
 * @description Integration component that can be dynamically rendered as an AI message. This will be used as 
 * a chat message component. We use the integration registry and current step to figure out what component to 
 * actually be rendered. I dont know if I like this yet.
 * @param integrationProps 
 * @see ChatMessageComponent.tsx
 */
export default function Integration({ 
	integrationProps,
	isStreaming,
	animationDelay 
  }: { 
	integrationProps: IntegrationManagerProps;
	isStreaming?: boolean;
	animationDelay?: number;
  }) {
	//console.log("INTEGRAITON PROPS", integrationProps)
	const { projectId, status,  threadId, chatSessionId, currentStep, serviceName } = integrationProps
	
	
 
	//Grab component of integration step from registration registry using service name
	const integration = IntegrationRegistry[serviceName];
	const step = integration.steps[currentStep];

	if (!step) {
		return <div>✅ Integration complete</div>;
	}

	const StepComponent = step.component;
	
	/**
	 * @description Function to be used to proceed to next step of the integration steps, done by 
	 * adding a new message to use chat message hook.  
	 * @param data 
	 */
	function handleComplete(data: IntegrationManagerProps){
		// if (step.onComplete) {
		// 	await step.onComplete(data);
		// }

		const nextStepProps = {
			...data
			, currentStep: currentStep + 1
		} as IntegrationManagerProps
		
		// Add a new message for the next step
		// dispatch(addMessage({
		// 	chat_session_id: nextStepProps.chatSessionId,
		// 	role: "AI",
		// 	content: "",
		// 	created_at: new Date().toISOString(),
		// 	is_typewriter: false,
		// 	message_id: crypto.randomUUID(),
		// 	component:{
		// 		component_type: "integration",
		// 		component_props: nextStepProps
		// 	}
		// }));
	}; 	

	const stepProps: IntegrationStepProps = {
		projectId,
		threadId,
		serviceName,
		chatSessionId,
		currentStep,
		nextStep: handleComplete,
	};
	

	return (
		<div className="w-full">
			<StepComponent {...stepProps} />
		</div>
	);
}

