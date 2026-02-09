import { AppDispatch, RootState } from "@/store/store";
import { refreshToken } from "@/features/auth/authSlice";
import { getAuthHeaders } from "@/services/api";

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<Response> => {
  let state = getState();
  let token = state.auth.token;

  // Initial request
  let headers = {
    ...options.headers,
    ...(token ? getAuthHeaders(token) : {}),
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token might be expired, try to refresh
    try {
      // Check if we already have a refresh token
      if (!state.auth.refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("Token expired, attempting refresh...");
      const resultAction = await dispatch(refreshToken());
      
      if (refreshToken.fulfilled.match(resultAction)) {
        // Refresh successful, get new token
        const newToken = resultAction.payload;
        console.log("Token refreshed successfully");
        
        // Retry request with new token
        headers = {
            ...options.headers,
            ...getAuthHeaders(newToken),
        };
        
        response = await fetch(url, { ...options, headers });
      } else {
        console.log("Token refresh failed");
        // Refresh failed, error will be thrown by the thunk or handled here
        // The refreshToken thunk already dispatches logout on failure
      }
    } catch (error) {
       console.error("Error during token refresh:", error);
       throw error;
    }
  }

  return response;
};
