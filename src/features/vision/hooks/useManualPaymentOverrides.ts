import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  MANUAL_OVERRIDES_KEY,
  ManualOverrides,
} from "../utils/liabilityPayments";

/**
 * Carga y persiste los overrides manuales de "pagado"/"no pagado" por
 * pasivo y mes, compartidos entre `LiabilityPaymentsManagementScreen`
 * (lectura + escritura) y `LiabilityPaymentsScreen` (solo lectura).
 */
export const useManualPaymentOverrides = () => {
  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({});

  useEffect(() => {
    AsyncStorage.getItem(MANUAL_OVERRIDES_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as ManualOverrides;
        setManualOverrides(parsed || {});
      })
      .catch(() => {});
  }, []);

  const persistOverrides = useCallback((next: ManualOverrides) => {
    AsyncStorage.setItem(MANUAL_OVERRIDES_KEY, JSON.stringify(next)).catch(
      () => {},
    );
  }, []);

  return { manualOverrides, setManualOverrides, persistOverrides };
};
