// lib/util/credit-check.ts
import { RootState } from "@/app/lib/redux/store";

/**
 * Check if user has sufficient credits
 * @param state - Redux root state
 * @returns true if user has credits, false otherwise
 */
export function hasCredits(state: RootState): boolean {
  return state.user.userData.credit_balance > 0;
}

/**
 * Get current credit balance
 * @param state - Redux root state
 * @returns current credit balance
 */
export function getCreditBalance(state: RootState): number {
  return state.user.userData.credit_balance;
}