/**
 * Utilidades compartidas por `LiabilityPaymentsManagementScreen` y
 * `LiabilityPaymentsScreen`: cálculo de rangos de mes, etiquetas de fecha y
 * el shape de los overrides manuales persistidos en `AsyncStorage`.
 */

export type ManualOverrides = Record<string, Record<string, boolean>>;

export const MANUAL_OVERRIDES_KEY = "liability_payment_overrides_v1";

export const toMonthKey = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

export const getMonthStart = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1, 0, 0, 0, 0).getTime();

export const getMonthEnd = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();

/** Etiqueta de mes sin año, p. ej. "Enero" (usada en `LiabilityPaymentsScreen`). */
export const getMonthLabel = (year: number, monthIndex: number) => {
  const date = new Date(year, monthIndex, 1);
  const label = date.toLocaleDateString("es-ES", { month: "long" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
};

/** Etiqueta de mes con año, p. ej. "Enero 2026" (usada en `LiabilityPaymentsManagementScreen`). */
export const getMonthYearLabel = (year: number, monthIndex: number) => {
  const date = new Date(year, monthIndex, 1);
  const label = date.toLocaleDateString("es-ES", { month: "long" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
};

export const getDueDateLabel = (
  year: number,
  monthIndex: number,
  dueDay: number,
) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.max(1, Math.min(dueDay, daysInMonth));
  const date = new Date(year, monthIndex, safeDay);
  const formatted = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
  return formatted.replace(".", "");
};
