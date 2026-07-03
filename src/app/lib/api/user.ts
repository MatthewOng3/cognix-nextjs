import type { UserRedux } from "../redux/features/userSlice";
import type { ApiResponse } from "../util/types/api";

/**
 * @description Get full user data to be saved in redux state
 * @param userId
 * @returns
 */
export async function getFullUserData(userId: string): Promise<UserRedux> {
  if (!userId) throw new Error("User ID is required");

  const response = await fetch(`/api/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const responseData: ApiResponse<UserRedux> = await response.json();

 
  if (!responseData.success || !responseData.data) {
    throw new Error(responseData.error || "Failed to fetch full project data");
  }

  return responseData.data;
}
