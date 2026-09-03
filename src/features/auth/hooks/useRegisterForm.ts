import { useTheme } from "@/contexts/ThemeContext";
import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setError, setLoading } from "../authSlice";
import { completeAuthSession } from "../utils/completeAuthSession";

const isValidDate = (dateString: string) => {
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  if (!regex.test(dateString)) return false;

  const parts = dateString.split("-");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
};

const formatDateMask = (text: string) => {
  // Remove non-numeric characters
  const cleaned = text.replace(/[^0-9]/g, "");

  // Limit length to 8 characters (DDMMAAAA)
  let formatted = cleaned.substring(0, 8);

  // Insert hyphens
  if (formatted.length > 4) {
    formatted = `${formatted.slice(0, 2)}-${formatted.slice(2, 4)}-${formatted.slice(4)}`;
  } else if (formatted.length > 2) {
    formatted = `${formatted.slice(0, 2)}-${formatted.slice(2)}`;
  }

  return formatted;
};

/**
 * Owns everything that used to live in `RegisterScreen`'s body: form
 * state, the date-mask formatter and date-validation regex applied to the
 * DOB field, and the register request against the Django backend
 * (including its field-shaped error parsing and the auto-login +
 * best-effort biometrics tail shared with `useLoginForm` via
 * `completeAuthSession`).
 */
export const useRegisterForm = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleDateChange = useCallback((text: string) => {
    setDob(formatDateMask(text));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const handleRegister = useCallback(async () => {
    if (!firstName || !lastName || !dob || !email || !password) {
      dispatch(setError("Por favor completa todos los campos"));
      return;
    }

    if (!isValidDate(dob)) {
      dispatch(setError("Por favor ingresa una fecha válida (DD-MM-AAAA)"));
      return;
    }

    if (!termsAccepted) {
      dispatch(setError("Debes aceptar los términos y condiciones"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const res = await fetch(endpoints.auth.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle Django errors
        // Django returns { field: ["error message"], ... }
        let errorMessage = "Error en el registro";
        if (data.username) errorMessage = `Usuario: ${data.username[0]}`;
        else if (data.email) errorMessage = `Email: ${data.email[0]}`;
        else if (data.password)
          errorMessage = `Contraseña: ${data.password[0]}`;
        else if (data.detail) errorMessage = data.detail;

        throw new Error(errorMessage);
      }

      console.log("User registered:", data);

      // Auto-login if tokens are present
      if (data.access && data.refresh) {
        await completeAuthSession(dispatch, {
          token: data.access,
          refreshToken: data.refresh,
          user: data.user,
        });

        router.replace("/");
      } else {
        // Fallback if no tokens (shouldn't happen with updated backend)
        router.replace("/login");
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      dispatch(setError(err.message || "Error desconocido"));
    } finally {
      dispatch(setLoading(false));
    }
  }, [
    dispatch,
    dob,
    email,
    firstName,
    lastName,
    password,
    router,
    termsAccepted,
  ]);

  const openTerms = useCallback(() => {
    Linking.openURL("https://www.walletBudget.net/Terms.pdf");
  }, []);

  const onLoginPress = useCallback(() => {
    router.replace("/login");
  }, [router]);

  return {
    colors,
    loading,
    error,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    dob,
    handleDateChange,
    email,
    setEmail,
    password,
    setPassword,
    isPasswordVisible,
    togglePasswordVisibility,
    termsAccepted,
    setTermsAccepted,
    handleRegister,
    openTerms,
    onLoginPress,
  };
};
