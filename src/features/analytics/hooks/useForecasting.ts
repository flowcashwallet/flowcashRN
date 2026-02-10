import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { endpoints, getAuthHeaders } from '@/services/api';
import { RootState } from '@/store/store';

export interface ForecastData {
  has_budget: boolean;
  disposable_budget: number;
  current_expenses: number;
  remaining_budget: number;
  daily_burn_rate: number;
  status: 'safe' | 'warning' | 'danger';
  forecast_date: string | null;
  message: string;
}

export function useForecasting() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
        setLoading(false);
        return;
    }

    setLoading(true);
    fetch(endpoints.wallet.forecast, {
      headers: getAuthHeaders(token),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch forecast');
        return res.json();
      })
      .then((data) => {
        setForecast(data);
      })
      .catch((err) => {
        console.error("Forecast error:", err);
        setForecast(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return { forecast, loading };
}
