import { Transaction } from "@/features/wallet/data/walletSlice";

export interface RecurringExpense {
  description: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

export interface CategoryInsight {
  category: string;
  totalAmount: number;
  percentage: number;
}

export const calculateRecurringExpenses = (transactions: Transaction[]): RecurringExpense[] => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const grouped: Record<string, { count: number; total: number }> = {};

  expenses.forEach(t => {
    // Normalizar descripción: minúsculas y quitar espacios extra
    const desc = t.description.trim().toLowerCase();
    if (!desc) return;
    
    if (!grouped[desc]) {
      grouped[desc] = { count: 0, total: 0 };
    }
    grouped[desc].count += 1;
    grouped[desc].total += t.amount;
  });

  return Object.keys(grouped)
    .map(key => ({
      description: key.charAt(0).toUpperCase() + key.slice(1), // Capitalizar para mostrar
      count: grouped[key].count,
      totalAmount: grouped[key].total,
      averageAmount: grouped[key].total / grouped[key].count
    }))
    .filter(item => item.count > 1) // Solo recurrentes (aparecen más de una vez)
    .sort((a, b) => b.count - a.count); // Ordenar por frecuencia descendente
};

export const calculateTopCategories = (transactions: Transaction[]): CategoryInsight[] => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const grouped: Record<string, number> = {};

  expenses.forEach(t => {
    const cat = t.category || 'Sin categoría';
    grouped[cat] = (grouped[cat] || 0) + t.amount;
  });

  return Object.keys(grouped)
    .map(key => ({
      category: key,
      totalAmount: grouped[key],
      percentage: totalExpenses > 0 ? (grouped[key] / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5); // Top 5
};

export const generateFinancialTips = (transactions: Transaction[]): string[] => {
  const tips: string[] = [];
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');
  
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Tip sobre balance general
  if (totalExpense > totalIncome && totalIncome > 0) {
    tips.push("⚠️ Alerta: Tus gastos superan tus ingresos. Considera revisar gastos no esenciales.");
  } else if (totalIncome > 0 && (totalIncome - totalExpense) < (totalIncome * 0.1)) {
    tips.push("📉 Tu margen de ahorro es bajo (<10%). Intenta reducir gastos hormiga.");
  } else if (totalIncome > 0 && (totalIncome - totalExpense) > (totalIncome * 0.2)) {
    tips.push("🚀 ¡Excelente! Estás ahorrando más del 20% de tus ingresos.");
  }

  // Tip sobre categorías específicas
  const diningExpenses = expenses.filter(t => t.category?.includes("Comida") || t.category?.includes("Restaurante") || t.category?.includes("🍔"));
  const diningTotal = diningExpenses.reduce((sum, t) => sum + t.amount, 0);
  
  if (totalExpense > 0 && (diningTotal / totalExpense) > 0.3) {
    tips.push("🍔 Estás destinando más del 30% de tus gastos a comida. Cocinar en casa podría ayudarte a ahorrar.");
  }

  const subscriptionExpenses = expenses.filter(t => 
    t.description.toLowerCase().includes("netflix") || 
    t.description.toLowerCase().includes("spotify") || 
    t.description.toLowerCase().includes("suscrip") ||
    t.description.toLowerCase().includes("premium")
  );
  
  if (subscriptionExpenses.length > 3) {
    tips.push("📺 Tienes muchas suscripciones activas. Revisa si realmente las usas todas.");
  }

  if (tips.length === 0) {
    tips.push("💡 Sigue registrando tus gastos para recibir consejos personalizados más precisos.");
  }

  return tips;
};
