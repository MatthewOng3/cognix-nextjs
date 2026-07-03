/* eslint-disable */

// types/onboarding.ts
export type OnboardingType = "user" | "project";

export type UserOnboardingStep =
  | "profile_setup"
  | "welcome_tour"
  | "preferences";

export type ProjectOnboardingStep = "project_name" | "brainstorm" | "edit_prd";

export type OnboardingStep = UserOnboardingStep | ProjectOnboardingStep;

export interface BaseOnboardingState {
  completed: boolean;
  currentStep: OnboardingStep | null;
  stepIndex: number;
  completedSteps: OnboardingStep[];
}

export interface UserOnboardingState extends BaseOnboardingState {
  type: "user";
  currentStep: UserOnboardingStep | null;
  completedSteps: UserOnboardingStep[];
}

export interface ProjectOnboardingState extends BaseOnboardingState {
  type: "project";
  currentStep: ProjectOnboardingStep | null;
  completedSteps: ProjectOnboardingStep[];
  projectId: string;
}

export type OnboardingState = UserOnboardingState | ProjectOnboardingState;

//config/onboarding-flows.ts
export const USER_ONBOARDING_FLOW: UserOnboardingStep[] = [
  "profile_setup",
  "welcome_tour",
  "preferences",
];

export const PROJECT_ONBOARDING_FLOW: ProjectOnboardingStep[] = [
  "project_name",
  "brainstorm",
  "edit_prd",
];

const USER_ONBOARDING_REQUIRED = ["/", "/project", "/project/:projectId"];

import { useRouter } from "next/navigation";
// hooks/useOnboarding.ts
import { useCallback, useState } from "react";
 
import type { OnboardingStateV2 } from "../lib/redux/features/userSlice";
import type { ApiResponse } from "../lib/util/types/api";
import { useUser } from "./use-user";
import { FlowState } from "../lib/util/supabase/types/tables";

interface UseOnboardingReturn {
  // State getters
  userOnboarding: UserOnboardingState | null;
  projectOnboarding: (projectId: string) => ProjectOnboardingState | null;

  // Status checkers
  isUserOnboardingComplete: boolean;
  isProjectOnboardingComplete: (projectId: string) => boolean;
  isOnboardingRequired: (
    route: string,
    projectId?: string,
  ) => {
    required: boolean;
    type: OnboardingType | null;
    redirectPath: string | null;
  };

  saveOnboardingState: (route: string, onboardingState: FlowState) => void;

  // Actions
  completeUserOnboardingStep: (step: UserOnboardingStep) => Promise<void>;
  completeProjectOnboardingStep: (
    projectId: string,
    step: ProjectOnboardingStep,
  ) => Promise<void>;
  resetOnboarding: (type: OnboardingType, projectId?: string) => Promise<void>;

  // Navigation helpers
  getNextOnboardingRoute: (
    type: OnboardingType,
    projectId?: string,
  ) => string | null;
  redirectToOnboarding: (type: OnboardingType, projectId?: string) => void;

  // Loading states
  loading: boolean;
  error: string | null;
}

export function useOnboarding() {
  const router = useRouter();

  // Get user state from redux
  const { userData, setUserOnboardingState } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user onboarding is complete
  const isUserOnboardingComplete = userData.completed_onboarding || false;

  /**
   * @description Function to check in routes to check if specific current route is needed to redirect to onboarding
   * @param route Current route the function is being called from
   * @param projectId Certain routes have project id in route params so use that to match
   */
  const isOnboardingRequired = useCallback(
    (route: string, projectId?: string) => {
      // Check user onboarding requirement, replace project ID to match current route argument
      const requiresUserOnboarding = USER_ONBOARDING_REQUIRED.some(
        (protectedRoute) =>
          route.startsWith(
            protectedRoute.replace(":projectId", projectId || ""),
          ),
      );

      if (requiresUserOnboarding && !isUserOnboardingComplete) {
        return {
          required: true,
          type: "user" as OnboardingType,
          redirectPath: userData.onboarding_route ?? "/onboarding/name_project",
        };
      }

      return {
        required: false,
        type: null,
        redirectPath: null,
      };
    },
    [isUserOnboardingComplete],
  );

  /**
   * @description Save onboarding state and route to user table
   */
  const saveOnboardingState = useCallback(
    async (
      route: string,
      onboardingState: OnboardingStateV2,
      completedOnboarding: boolean = false,
    ) => {
      try {
        //Update user table row
        const response = await fetch("/api/user/onboarding", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            onboarding_state: onboardingState,
            onboarding_route: route,
            completed_onboarding: completedOnboarding,
          }),
          credentials: "include",
        });

        const responseData: ApiResponse<null> = await response.json();

        if (!responseData.success) {
          setError(responseData.error ?? "");
          return;
        }

        //Save onboarding state in redux once table update is successful
        setUserOnboardingState(onboardingState);
      } catch (err) {
        console.log("Error saving onboarding: ", err);
      }
    },
    [],
  );

  // Complete user onboarding step
  //   const completeUserOnboardingStep = useCallback(async (step: UserOnboardingStep) => {
  //     setLoading(true);
  //     setError(null);

  //     try {
  //       const response = await fetch('/api/user/onboarding/complete-step', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ step, type: 'user' })
  //       });

  //       if (!response.ok) throw new Error('Failed to complete step');

  //       const updatedState = await response.json();
  //       dispatch(updateUserOnboarding(updatedState));

  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'Failed to complete step');
  //     } finally {
  //       setLoading(false);
  //     }
  //   }, [dispatch]);

  // Get next onboarding route
  // const getNextOnboardingRoute = useCallback((type: OnboardingType, projectId?: string): string | null => {
  // 	if (type === 'user') {
  // 		if (isUserOnboardingComplete) return null;
  // 		const currentStep = userOnboarding?.currentStep;
  // 		const stepIndex = currentStep ? USER_ONBOARDING_FLOW.indexOf(currentStep) : 0;
  // 		return `/onboarding/user?step=${stepIndex}`;
  // 	} else if (projectId) {
  // 		if (isProjectOnboardingComplete(projectId)) return null;
  // 		const projectState = projectOnboarding(projectId);
  // 		const currentStep = projectState?.currentStep;
  // 		const stepIndex = currentStep ? PROJECT_ONBOARDING_FLOW.indexOf(currentStep) : 0;
  // 		return `/onboarding/project/${projectId}?step=${stepIndex}`;
  // 	}
  // 	return null;
  // }, [userOnboarding, isUserOnboardingComplete]);

  // Redirect to onboarding
  const redirectToOnboarding = useCallback(() => {
    const route = userData.onboarding_route;
    if (route) {
      router.replace(route);
    }
  }, [router]);

  return {
    isUserOnboardingComplete,
    isOnboardingRequired,
    redirectToOnboarding,
    saveOnboardingState,
    loading,
    error,
  };
}

// components/OnboardingGuard.tsx - Route protection component
// interface OnboardingGuardProps {
//   children: React.ReactNode;
//   projectId?: string;
//   fallback?: React.ReactNode;
// }

// export function OnboardingGuard({ children, projectId, fallback }: OnboardingGuardProps) {
//   const pathname = usePathname();
//   const { isOnboardingRequired, redirectToOnboarding, loading } = useOnboarding();

//   useEffect(() => {
//     const requirement = isOnboardingRequired(pathname, projectId);

//     if (requirement.required && requirement.type) {
//       redirectToOnboarding(requirement.type, projectId);
//     }
//   }, [pathname, projectId, isOnboardingRequired, redirectToOnboarding]);

//   if (loading) {
//     return fallback || <div>Loading...</div>;
//   }

//   const requirement = isOnboardingRequired(pathname, projectId);

//   if (requirement.required) {
//     return fallback || <div>Redirecting to onboarding...</div>;
//   }

//   return <>{children}</>;
// }

// // Usage Examples:

// // In a component that needs onboarding check:
// export function ProjectDashboard({ projectId }: { projectId: string }) {
//   const {
//     isProjectOnboardingComplete,
//     redirectToOnboarding,
//     completeProjectOnboardingStep
//   } = useOnboarding();

//   useEffect(() => {
//     if (!isProjectOnboardingComplete(projectId)) {
//       redirectToOnboarding('project', projectId);
//     }
//   }, [projectId, isProjectOnboardingComplete, redirectToOnboarding]);

//   return (
//     <OnboardingGuard projectId={projectId}>
//       <div>Your protected project content here</div>
//     </OnboardingGuard>
//   );
// }

// // In your app layout or page components:
// export default function ProtectedPage() {
//   return (
//     <OnboardingGuard>
//       <YourPageContent />
//     </OnboardingGuard>
//   );
// }
