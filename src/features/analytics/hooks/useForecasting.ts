import { endpoints, getAuthHeaders } from "@/services/api";
import { RootState } from "@/store/store";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

export interface ForecastData {
  has_budget: boolean;
  disposable_budget: number;
  current_expenses: number;
  remaining_budget: number;
  daily_burn_rate: number;
  status: "safe" | "warning" | "danger";
  forecast_date: string | null;
  message: string;
}

export function useForecasting() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = useCallback(() => {
    if (!token) {
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    return fetch(endpoints.wallet.forecast, {
      headers: getAuthHeaders(token),
    })
      .then((res) => {
        console.log("Raw forecast response:", res.formData);
        if (!res.ok) throw new Error("Failed to fetch forecast");
        return res.json();
      })
      .then((data) => {
        console.log("Processed forecast data:", data);
        setForecast(data);
      })
      .catch((err) => {
        console.error("Forecast error:", err);
        setForecast(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, refresh: fetchForecast };
}
