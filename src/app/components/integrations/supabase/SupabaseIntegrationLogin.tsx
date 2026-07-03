/* eslint-disable */

"use client";
import { ApiResponse } from "@/app/lib/util/types/api";
import { useProject } from "@/app/hooks/use-project";
import { IntegrationStepProps } from "@/app/lib/util/types/integration-component";

export default function SupabaseIntegrationLogin(stepProps: IntegrationStepProps) {
	const {activeProject} = useProject();
 
	async function OAuthConnectHandler(){

		if(activeProject?.projectId){
			const res = await fetch("/api/oauth/connect/supabase", {
				method: "POST",
				headers: {
				  "Content-Type": "application/json",
				},
				body: JSON.stringify({ projectId: stepProps.projectId, integrationName: 'supabase', projectName: activeProject?.projectName, repoId: activeProject.repoId, repoName: activeProject.repoUrl }),
			});
	
			const result: ApiResponse<{url: string}> = await res.json();
			if(result.success && result.data)  // Open the Supabase consent URL in a new tab
				window.open(result.data.url, "_blank", "noopener,noreferrer"); // redirect user to Supabase consent
		}
		 
	};

	return (
		<div className="flex flex-col w-full p-4 rounded-xl shadow-sm border border-gray-800 bg-neutral-950">
			<h2 className="text-base font-semibold mb-1 text-white">
				Connect to Supabase
			</h2>
			<p className="text-sm text-gray-400 mb-4 max-w-sm">
				I can help you build and manage your backend for you but first I need access to a supabase organization in your account.<br/>
				Rest assured your data is safe and secure with us and we do not sell your data to any third party. 
				<br/>
				
				First Login or Signup to Supabase with the button below and you will be prompted to first create an organization for your project
				if none exists. <br/> 
				<br/>

				After that you will be prompted to authorize Cognix API access to the created organization and that's it! 
			</p>

			<button className="rounded-lg overflow-hidden hover:opacity-90 transition cursor-pointer" onClick={OAuthConnectHandler}>
				<img
				src="/connect-supabase-dark.svg"
				alt="Connect with Supabase"
				className="h-10 w-auto"
				/>
		</button>
		</div>
	);
}
