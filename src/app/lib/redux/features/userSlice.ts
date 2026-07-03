import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { FlowState } from "../../util/supabase/types/tables";
 
export type OnboardingStateV2 = {
  projectId: string | undefined;
  plannerSessionId: string | undefined;
};

export type UserRedux = {
  plan_id: string;
  is_premium: boolean;
  last_login: string;
  created_at: string;
  completed_onboarding: boolean;
  onboarding_state: OnboardingStateV2;
  onboarding_route: string | null; //Page where user last stopped during first time onboarding
  credit_balance: number;
};

type UserState = {
  userData: UserRedux;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  userData: {
    plan_id: "",
    is_premium: false,
    last_login: "",
    created_at: "",
    completed_onboarding: true,
    onboarding_state: {
      plannerSessionId: undefined,
      projectId: undefined,
    },
    onboarding_route: null,
    credit_balance: 0,
  },
  isLoading: false,
  error: null,
};

/**
 * @description Redux slice for project state management
 * @param name - The name of the slice
 * @param initialState - The initial state of the slice
 * @param reducers - The reducers for the slice
 * @returns The project slice
 */
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    //Set current project data schema
    setUserData: (state, action: PayloadAction<UserRedux>) => {
      state.userData = action.payload;
      state.isLoading = false;
    },
    setOnboardingFlowState: (state, action: PayloadAction<FlowState>) => {
      return { ...state, onboarding_state: action.payload };
    },
    setOnboardingState: (state, action: PayloadAction<OnboardingStateV2>) => {
      return { ...state, onboarding_state: action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUserData,
  setOnboardingFlowState,
  setLoading,
  setError,
  setOnboardingState,
} = userSlice.actions;

export default userSlice.reducer;
