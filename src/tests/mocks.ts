// Centralized mock data for tests

export const mockThemeColors = {
  primary: "#000",
  surface: "#fff",
  surfaceHighlight: "#eee",
  text: "#000",
  textSecondary: "#666",
  error: "red",
  success: "green",
  background: "#fff",
  border: "#ccc",
};

export const mockUser = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
};

// Vision Data
export const mockVisionDataFactory = (overrides = {}) => ({
  user: mockUser,
  transactions: [],
  refreshing: false,
  onRefresh: jest.fn(),
  assets: [
    {
      id: "1",
      name: "House",
      amount: 500000,
      type: "asset",
      category: "Real Estate",
    },
    {
      id: "2",
      name: "Stocks",
      amount: 50000,
      type: "asset",
      category: "Investments",
    },
  ],
  liabilities: [
    {
      id: "3",
      name: "Mortgage",
      amount: 300000,
      type: "liability",
      category: "Loans",
    },
  ],
  netWorth: 250000,
  totalAssets: 550000,
  totalLiabilities: 300000,
  loading: false,
  error: null,
  colors: mockThemeColors,
  ...overrides,
});

export const mockVisionOperationsFactory = (overrides = {}) => ({
  handleAddEntity: jest.fn(),
  handleUpdateEntity: jest.fn(),
  handleDeleteEntity: jest.fn(),
  handleUpdateCryptoPrice: jest.fn(),
  handleAddTransactionToEntity: jest.fn(),
  ...overrides,
});

// Budget Data
export const mockBudgetDataFactory = (overrides = {}) => ({
  isSetup: true,
  budgetLoading: false,
  colors: mockThemeColors,
  ...overrides,
});

export const mockBudgetDashboardFactory = (overrides = {}) => ({
  colors: mockThemeColors,
  handleReset: jest.fn(),
  pieData: [],
  barData: [],
  monthName: "Enero",
  currentYear: 2026,
  remainingBudget: 1000,
  monthlyIncome: 5000,
  totalActualExpense: 2000,
  totalActualIncome: 5000,
  totalFixedExpenses: 2000,
  user: mockUser,
  ...overrides,
});

export const mockBudgetSetupFactory = (overrides = {}) => ({
  step: 1,
  setStep: jest.fn(),
  income: "5000",
  setIncome: jest.fn(),
  expenses: [],
  expenseName: "",
  setExpenseName: jest.fn(),
  expenseAmount: "",
  setExpenseAmount: jest.fn(),
  expenseCategory: null,
  setExpenseCategory: jest.fn(),
  isCategoryDropdownOpen: false,
  setCategoryDropdownOpen: jest.fn(),
  handleAddExpense: jest.fn(),
  handleRemoveExpense: jest.fn(),
  handleSaveBudget: jest.fn(),
  canGoNext: true,
  totalExpenses: 0,
  ...overrides,
});

// Wallet Data
export const mockWalletDataFactory = (overrides = {}) => ({
  currentMonthTransactions: [
    {
      id: "1",
      description: "Grocery",
      amount: 100,
      type: "expense",
      category: "Food",
      date: new Date("2024-01-01").getTime(),
      relatedEntityId: null,
      paymentType: "cash",
    },
    {
      id: "2",
      description: "Salary",
      amount: 5000,
      type: "income",
      category: "Job",
      date: new Date("2024-01-02").getTime(),
      relatedEntityId: null,
      paymentType: "transfer",
    },
  ],
  balance: 4900,
  income: 5000,
  expense: 100,
  currentMonthName: "Enero",
  refreshing: false,
  onRefresh: jest.fn(),
  colors: mockThemeColors,
  visionEntities: [],
  streak: { count: 5, status: "hot" },
  repairedDays: [],
  categories: [],
  selectedDate: new Date("2024-01-01"),
  setSelectedDate: jest.fn(),
  loading: false,
  error: null,
  ...overrides,
});

// Analytics Data
export const mockForecastFactory = (overrides = {}) => ({
  status: "safe",
  message: "Your finances are looking good!",
  daily_burn_rate: 50.0,
  projected_balance: 1000.0,
  tip: "Save more!",
  ...overrides,
});

export const mockAnalyticsDataFactory = (overrides = {}) => ({
  recurringExpenses: [
    { description: "Netflix", averageAmount: 15.0 },
    { description: "Spotify", averageAmount: 10.0 },
  ],
  topCategories: [
    {
      category: "Food",
      percentage: 40,
      totalAmount: 400,
      transactions: [
        {
          id: "1",
          description: "Burger King",
          date: "2024-01-15",
          amount: 15.5,
        },
      ],
    },
    {
      category: "Transport",
      percentage: 30,
      totalAmount: 300,
      transactions: [],
    },
  ],
  financialTips: ["Spend less on coffee", "Invest early"],
  selectedDate: new Date("2024-01-01"),
  setSelectedDate: jest.fn(),
  currentMonthName: "Enero",
  currentYear: 2024,
  onRefresh: jest.fn().mockResolvedValue(true),
  refreshing: false,
  ...overrides,
});
