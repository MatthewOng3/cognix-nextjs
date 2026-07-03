// "use client";
// import { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";
// import { useUser } from "../hooks/use-user";
// import {
//   setOnboardingFlowState,
//   setUserData,
//   type UserRedux,
// } from "../lib/redux/features/userSlice";
// import type { ApiResponse } from "../lib/util/types/api";
// import BrainstormIdea from "./BrainstormIdea";
// import EditProductDoc from "./EditProductDoc";
// import { LoadingOverlay } from "./loading-overlay";
// import NameProject from "./NameProject";

// //============== Flow Shared Data ===============
// export type FlowState = {
//   projectId: string | undefined;
//   plannerSessionId: string | undefined;
//   userId: string | undefined;
//   stepIndex: number;
// };

// export type OnboardingStepComponentProps = {
//   nextStep: (flowState: FlowState) => Promise<void>;
// };

// export type OnboardingStep = {
//   id: string;
//   title: string;
//   component: (props: OnboardingStepComponentProps) => React.ReactElement;
// };

// type OnboardingFlowProps = {
//   onboardingFlow: OnboardingStep[];
//   onComplete: () => void;
// };

// //============== Various Onboarding Flows ===============
// export const PROJECT_ONBOARDING: OnboardingStep[] = [
//   { id: "brainstorm", title: "Brainstorm", component: BrainstormIdea },
//   { id: "edit-prd", title: "Edit Prd", component: EditProductDoc },
// ];

// export const ONBOARDING_STEPS: OnboardingStep[] = [
//   { id: "project", title: "Create Project", component: NameProject },
//   ...PROJECT_ONBOARDING,
// ];

// //============== Constants ===============
// export const ONBOARDING_STORAGE_KEY = "onboarding_progress_v1";

// //============== Main Component ===============
// /**
//  * @description Main onboarding component that renders step components based on step index. Use redux to access flow state and step index.
//  * Might be overengineering honestly , keen to move off this
//  * @param param
//  * @returns
//  */
// export default function OnboardingFlow({
//   onboardingFlow,
//   onComplete,
// }: OnboardingFlowProps) {
//   const dispatch = useDispatch();
//   //Use redux as the shared state
//   const { userData, userId } = useUser();
//   const [loading, setLoading] = useState(true);

//   //const [currentStepIndex, setCurrentStepIndex] = useState<number>(userSliceState.onboarding_state.stepIndex);

//   useEffect(() => {
//     const init = async () => {
//       if (!userData.last_login) {
//         await fetchOnboardingState();
//       }
//       setLoading(false);
//     };
//     init();
//   }, []);

//   //Step tracker
//   const steps = onboardingFlow.length;
//   const stepIndex = userData.onboarding_state?.stepIndex ?? 0;
//   const StepComponent = onboardingFlow[stepIndex]?.component;

//   /**
//    * @description Persist onboarding state changes to user table on backend
//    * @param currentFlowState
//    */
//   async function saveOnboardingState(currentFlowState: FlowState) {
//     const response = await fetch("/api/user/onboarding", {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         onboarding_state: currentFlowState,
//       }),
//     });

//     const responseData: ApiResponse<null> = await response.json();

//     if (responseData.error) {
//       console.error(responseData.error, "Error saving onboarding state");
//     }
//   }

//   /**
//    * @description Persist onboarding state changes to user table on backend
//    * @param currentFlowState
//    */
//   async function fetchOnboardingState() {
//     const response = await fetch("/api/user", {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     const responseData: ApiResponse<UserRedux> = await response.json();

//     console.log("FETCH ONBOARDING", responseData);
//     if (responseData.error) {
//       console.error(responseData.error, "Error saving onboarding state");
//     }

//     if (responseData.data) {
//       dispatch(setUserData(responseData.data));
//     }
//   }

//   /**
//    * @description Function to be called in ecah step component to move to next onboarding step
//    * @param stepData
//    */
//   const next = async (stepData: FlowState) => {
//     const nextIndex = stepData.stepIndex + 1;
//     const updatedData: FlowState = { ...stepData, stepIndex: nextIndex };

//     if (nextIndex < steps) {
//       dispatch(setOnboardingFlowState(updatedData));
//     } else {
//       onComplete();
//     }

//     //Persist new onboarding state to backend at the end of each step
//     await saveOnboardingState(updatedData);
//   };

//   // 🚨 Prevent rendering before onboarding state is loaded
//   if (loading || !userData.onboarding_state || !userId) {
//     return <LoadingOverlay text="" />;
//   }

//   return (
//     <div className="flex items-center justify-center h-screen px-3 bg-gradient-to-br from-[#7e5bef] via-gray-200 to-gray-100">
//       <div className="h-10/12  flex w-6/12">
//         <StepComponent nextStep={next} />
//       </div>
//     </div>
//   );
// }
