import { AppDispatch } from "@/store/store";
import { enableBiometrics, loginSuccess } from "../authSlice";

type CompleteAuthSessionPayload = Parameters<typeof loginSuccess>[0];

/**
 * Shared tail-end of both `LoginScreen`/`RegisterScreen`'s API calls:
 * persist the freshly issued token pair via `loginSuccess`, then make a
 * best-effort attempt to enroll biometrics. A biometrics failure (no
 * hardware, not enrolled, user cancels) is expected and swallowed — same
 * behavior as the original inline `try/catch` duplicated in both screens.
 */
export const completeAuthSession = async (
  dispatch: AppDispatch,
  payload: CompleteAuthSessionPayload,
) => {
  await dispatch(loginSuccess(payload)).unwrap();

  try {
    await dispatch(enableBiometrics()).unwrap();
  } catch (bioError) {
    console.log("Biometrics not enabled or failed:", bioError);
  }
};
