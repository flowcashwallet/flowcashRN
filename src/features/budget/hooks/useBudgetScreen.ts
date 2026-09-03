import { useBudgetData } from "@/features/budget/hooks/useBudgetData";
import { useCallback, useState } from "react";

/**
 * Compone `useBudgetData()` sin duplicar su fetch, y absorbe el único estado
 * local que vivía en `BudgetScreen.tsx` (`isEditing`, que decide si se
 * muestra `BudgetDashboard` o `BudgetSetupWizard`) junto con los dos
 * handlers que antes eran arrow functions inline en
 * `unstable_headerRightItems` (editar / cancelar edición).
 */
export const useBudgetScreen = () => {
  const { isSetup, budgetLoading, colors } = useBudgetData();
  const [isEditing, setIsEditing] = useState(false);

  const onStartEditing = useCallback(() => setIsEditing(true), []);
  const onCancelEditing = useCallback(() => setIsEditing(false), []);

  return {
    isSetup,
    budgetLoading,
    colors,
    isEditing,
    onStartEditing,
    onCancelEditing,
  };
};
