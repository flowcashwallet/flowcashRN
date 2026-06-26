export interface DashboardColors {
  text: string;
  textSecondary: string;
  border: string;
  surface: string;
  surfaceHighlight: string;
  primary: string;
  success: string;
  error: string;
}

export interface ExpenseTrendPoint {
  value: number;
  label: string;
  dataPointText: string;
}

export interface ExpenseTrend {
  data: ExpenseTrendPoint[];
  hasData: boolean;
}

export interface WeeklyCategory {
  category: string;
  amount: number;
}

export interface WeeklyDetail {
  label: string;
  range: string;
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
  categories: WeeklyCategory[];
  incomeCategories: WeeklyCategory[];
}

export interface CategorySpikeAlert {
  category: string;
  currentAmount: number;
  averageAmount: number;
  increasePct: number;
  weekLabel: string;
}

export interface AnomalousMovement {
  id: string;
  description: string;
  category: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  expected: number;
  zScore: number;
  date: number;
}

export interface UpcomingFixedPaymentItem {
  key: string;
  description: string;
  category: string;
  amount: number;
  dueDate: Date;
  recurrenceFrequency: "weekly" | "monthly" | "yearly";
}

export interface UpcomingFixedPaymentsSummary {
  items: UpcomingFixedPaymentItem[];
  total: number;
  expectedBalanceAfterFixed: number;
}
