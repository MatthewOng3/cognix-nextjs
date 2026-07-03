// lib/redux/features/creditSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CreditState {
  balance: number | null;
  showOutOfCreditsModal: boolean;
  lastChecked: string | null;
}

const initialState: CreditState = {
  balance: null,
  showOutOfCreditsModal: false,
  lastChecked: null,
};

export const creditSlice = createSlice({
  name: "credit",
  initialState,
  reducers: {
    setCreditBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
      state.lastChecked = new Date().toISOString();
    },

    setShowOutOfCreditsModal: (state, action: PayloadAction<boolean>) => {
      console.log("IN CREDIT REDUX OUT OF CREDITS", action.payload)
      state.showOutOfCreditsModal = action.payload;
    },

    decrementCredits: (state, action: PayloadAction<number>) => {
      if (state.balance !== null) {
        state.balance = Math.max(0, state.balance - action.payload);
      }
    },

    resetCreditState: (state) => {
      state.balance = null;
      state.showOutOfCreditsModal = false;
      state.lastChecked = null;
    },
  },
});

export const {
  setCreditBalance,
  setShowOutOfCreditsModal,
  decrementCredits,
  resetCreditState,
} = creditSlice.actions;

export default creditSlice.reducer;