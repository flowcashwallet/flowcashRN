import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { useState } from "react";
import { useDispatch, useStore } from "react-redux";

export interface DebtPlan {
  months_to_payoff: number;
  total_interest_paid: number;
  payoff_date: string;
  timeline: {
    month: number;
    total_balance: number;
    debts: {
      name: string;
      balance: number;
      paid: number;
    }[];
  }[];
}

export interface DebtPlans {
  snowball: DebtPlan;
  avalanche: DebtPlan;
}

export const useDebtPlanner = () => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<DebtPlans | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDebtPlans = async (extraPayment: number) => {
    setLoading(true);
    setError(null);
    try {
      const getState = () => store.getState();

      const url = `${endpoints.wallet.debtPlan}?extra_payment=${extraPayment}`;
      const response = await fetchWithAuth(
        url,
        { method: "GET" },
        dispatch,
        getState,
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError("Failed to fetch debt plans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    plans,
    error,
    fetchDebtPlans,
  };
};
