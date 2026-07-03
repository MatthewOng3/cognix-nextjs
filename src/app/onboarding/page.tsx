"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAlert } from "../components/AlertNotif";
import { LoadingOverlay } from "../components/loading-overlay";

import { useUser } from "../hooks/use-user";
import { setUserData, type UserRedux } from "../lib/redux/features/userSlice";
import type { ApiResponse } from "../lib/util/types/api";
import { FlowState } from "../lib/util/supabase/types/tables";

/**
 * @description Function to check if a specific onboarding flow has been set, else default to normal onboarding
 * Could probably find a better way to do this but cba.
 * @returns
 */
function getOnboardingFlow() {
  // Assume ONBOARDING_STEPS is your default array
//   const stored = localStorage.getItem("onboarding-type");

//   let onboardingSteps: OnboardingStep[];

//   try {
//     onboardingSteps = stored ? JSON.parse(stored) : ONBOARDING_STEPS;
//   } catch (e) {
//     console.error("Failed to parse onboardingSteps from localStorage", e);
//     onboardingSteps = ONBOARDING_STEPS;
//   }

//   return onboardingSteps;
}

/**
 * @description Page that triggers the onboarding flow
 * @returns
 */
export default function OnboardingPage() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const dispatch = useDispatch();
  const onboardingType = getOnboardingFlow(); //Dynamically get onboarding flow to be used

  //Grab onboarding state stored from home page load
  const { userData: userSliceState, userId } = useUser();

  /**
   * @description
   * @returns
   */
  async function fetchUserInfo() {
    try {
      const response = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const responseData: ApiResponse<UserRedux> = await response.json();

      //Set user slice data in redux store
      if (responseData.success && responseData.data) {
        // ✅ Default flow state if backend onboarding state is null or empty
        const initialFlowState: FlowState = {
          projectId: "",
          plannerSessionId: "",
          userId: undefined,
          stepIndex: 0,
        };

        const safeFlowState =
          !responseData.data.onboarding_state ||
          Object.keys(responseData.data.onboarding_state).length === 0
            ? initialFlowState
            : responseData.data.onboarding_state;

        dispatch(
          setUserData({
            ...responseData.data,
            onboarding_state: safeFlowState,
          }),
        );
      }

      return responseData;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }

  // Fetch user info if onboardingState has no userId
  useEffect(() => {
    if (!userSliceState.last_login) {
      fetchUserInfo();
    }
  }, [!userSliceState.last_login]);

  if (!userSliceState.last_login) {
    return <LoadingOverlay text="Loading.." />;
  }

  /**
   * @description Function to be executed when onboarding has completed
   */
  async function completeOnboarding() {
    //TODO Set user onboarding to true and remove markdown text for product doc
    const response = await fetch(`/api/user/complete_onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: userSliceState.onboarding_state.projectId,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      showAlert("Error Completing Onboarding", "error");
    }

    //Will need to also put in a parameter to trigger builder chat workflow
    router.replace(
      `/project/${userSliceState.onboarding_state.projectId}/build`,
    );

    //Once complete clear stored onboaring param
    localStorage.removeItem("onboarding-type");
  }

  return (
    <div>
        
    </div>
    // <OnboardingFlow
    //   onboardingFlow={onboardingType}
    //   onComplete={completeOnboarding}
    // />
  );
}
