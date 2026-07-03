import { useAppDispatch, useAppSelector } from "@/app/lib/redux/hooks";
import { getFullUserData } from "../lib/api/user";
import {
  type OnboardingStateV2,
  setError,
  setLoading,
  setOnboardingState,
  setUserData,
  type UserRedux,
} from "../lib/redux/features/userSlice";
import { useAuth } from "./use-auth";
import { useCallback } from "react";

/**
 * @description Custom hook to access and manage user state in redux store
 * @returns
 */
export function useUser() {
  const dispatch = useAppDispatch();
  const userState = useAppSelector((state) => state.user);
  const { userId } = useAuth();

  /**
   * @description Full fetch everything you need in project
   * @returns
   */
  const fetchUserInfo = useCallback(async () => {
    if (!userId) {
      console.warn("fetchUserInfo called before userId available");
      return;
    }
    try {
      const userData = await getFullUserData(userId ?? "");
      dispatch(setUserData(userData));
    } catch (err) {
      console.log("Error fetching entire project data", err);
    }
  }, [userId, dispatch]);

  return {
    // State
    userData: userState.userData,
    userReduxLoading: userState.isLoading,
    error: userState.error,
    userId,

    // Actions
    setUserRedux: (user: UserRedux) => dispatch(setUserData(user)),
    setUserLoading: (loading: boolean) => dispatch(setLoading(loading)),
    setUserError: (error: string | null) => dispatch(setError(error)),
    setUserOnboardingState: (os: OnboardingStateV2) =>
      dispatch(setOnboardingState(os)),
    fetchUserInfo,
  };
}
