import { useTheme } from "@/contexts/ThemeContext";
import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setError, setLoading } from "../authSlice";
import { completeAuthSession } from "../utils/completeAuthSession";

/**
 * Owns everything that used to live in `LoginScreen`'s body: email/password
 * form state, the Google auth-session listener (still not wired to a UI
 * trigger — `promptAsync` was unused in the original screen too, kept out
 * of the returned object for the same reason), and the email/password
 * login request against the Django backend, including the
 * `loginSuccess` + best-effort biometrics enrollment tail shared with
 * `useRegisterForm` via `completeAuthSession`.
 */
export const useLoginForm = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response] = Google.useAuthRequest({
    webClientId:
      "635821696580-ivj83nnvshqlvtp14qm9vrgtv9evlrnr.apps.googleusercontent.com",
    iosClientId:
      "635821696580-2cra0f8iruo4oblm9ufvf7051egp17kq.apps.googleusercontent.com",
    androidClientId:
      "635821696580-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com", // TODO: Reemplazar con tu Client ID de Android
  });

  useEffect(() => {
    if (request) {
      console.log("Redirect URI:", request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    console.log("Response:", response);
    if (response?.type === "success") {
      const { id_token } = response.params;

      if (!id_token) {
        dispatch(setError("No se pudo obtener el token de Google."));
        return;
      }

      // TODO: Implement Google Login with Django Backend
      dispatch(setError("Google Login not yet implemented with new backend"));
    }
  }, [response, dispatch]);

  const handleEmailAuth = useCallback(async () => {
    if (!email || !password) {
      dispatch(setError("Por favor ingresa correo y contraseña"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const res = await fetch(endpoints.auth.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Credenciales inválidas");
      }

      console.log("Login successful:", data);

      // data contains: access, refresh, and user object (from our custom serializer)
      await completeAuthSession(dispatch, {
        token: data.access,
        refreshToken: data.refresh,
        user: data.user,
      });
      console.log("User authenticated:", data.user);

      // Navigation is handled by auth state listener or manual replace
    } catch (err: any) {
      console.error("Login Error:", err);
      dispatch(setError(err.message || "Error al iniciar sesión"));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, email, password]);

  const onRegisterPress = useCallback(() => {
    router.push("/register");
    dispatch(setError(null));
  }, [dispatch, router]);

  return {
    colors,
    loading,
    error,
    email,
    setEmail,
    password,
    setPassword,
    handleEmailAuth,
    onRegisterPress,
  };
};
