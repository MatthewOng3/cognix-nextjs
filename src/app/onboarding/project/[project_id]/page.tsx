"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAlert } from "@/app/components/AlertNotif";
import { LoadingOverlay } from "@/app/components/loading-overlay";
 
import { useProject } from "@/app/hooks/use-project";
import { getFullProjectData } from "@/app/lib/api/project";
import { setCurrentProject } from "@/app/lib/redux/features/projectSlice";

/**
 * @description Page that triggers onboarding project flow
 * @returns
 */
export default function ProjectOnboardingPage() {
  // const { showAlert } = useAlert();
  // const router = useRouter();
  // const params = useParams<{ project_id: string }>();
  // const projectId = params.project_id;
  // const dispatch = useDispatch();

  // //Grab onboarding state stored from home page load
  // const { activeProject, projectReduxLoading } = useProject();

  // //As long as project id of active project is null , show loading overlay
  // // if (!activeProject?.projectId) {
  // // 	return <LoadingOverlay text="Loading Onboarding.." />;
  // // }

  // /**
  //  * @description
  //  * @returns
  //  */
  // async function fetchProjectInfo(inputProjectId: string) {
  //   try {
  //     const projectData = await getFullProjectData(inputProjectId);
  //     dispatch(setCurrentProject(projectData));
 
  //   } catch (err) {
  //     console.log("Error fetching entire project data", err);
  //     showAlert((err as Error).message, "error");
  //   }
  // }

  // // Fetch entire project data to set in redux when not already loading and projectId param variable loaded
  // useEffect(() => {
  //   if (!activeProject?.projectId && !projectReduxLoading && projectId) {
  //     fetchProjectInfo(projectId);
  //   }
  // }, [projectId, !activeProject?.projectId]);

  // /**
  //  * @description Function to be executed when onboarding has completed
  //  */
  // async function completeOnboarding() {
  //   // const response = await fetch(`/api/project/complete_onboarding`, {
  //   // 	method: "POST",
  //   // 	headers: {
  //   // 		"Content-Type": "application/json",
  //   // 	},
  //   // 	body: JSON.stringify({
  //   // 		projectId: activeProject?.projectId,
  //   // 	}),
  //   // 	credentials: "include",
  //   // });

  //   // if (!response.ok) {
  //   // 	showAlert("Error Completing Onboarding", "error");
  //   // }

  //   if (activeProject?.projectId) {
  //     //Will need to also put in a parameter to trigger builder chat workflow
  //     router.replace(
  //       `/project/${activeProject.projectId}/build?new_project=${true}`,
  //     );
  //   }
  // }

  // return (
  //   <>
  //     {!activeProject?.projectId || projectReduxLoading ? (
  //       <LoadingOverlay text="Loading Onboarding.." />
  //     ) : (
  //       <OnboardingFlow
  //         onboardingFlow={PROJECT_ONBOARDING}
  //         onComplete={completeOnboarding}
  //       />
  //     )}
  //   </>
  // );
  return (
    <div>
      
    </div>
  )
}
