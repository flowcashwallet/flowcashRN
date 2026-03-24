import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency } from "@/utils/format";
import { useWalletData } from "@/features/wallet/hooks/useWalletData";
import React from "react";
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const { transactions, income, expense, balance } = useWalletData();
  const insets = useSafeAreaInsets();
  
  const width = Dimensions.get('window').width;
  
  const recentTransactions = transactions.slice(0, 5);
  const savings = income - expense;

  const pieData = [
    { value: 40, color: '#8fb1ff' }, // Housing
    { value: 25, color: '#ff6b6b' }, // Lifestyle
    { value: 15, color: '#4ade80' }, // Investment
    { value: 20, color: '#2C2C2E' }, // Empty/Other
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <IconSymbol name="person.fill" size={20} color="#FFA07A" />
        </View>
        <Text style={styles.headerTitle}>The Kinetic Vault</Text>
        <IconSymbol name="bell.fill" size={20} color="#8E8E93" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Total Liquidity */}
        <View style={styles.totalLiquidityCard}>
          <Text style={styles.sectionSubtitle}>TOTAL LIQUIDITY</Text>
          <Text style={styles.liquidityAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.liquidityFooter}>
            <View style={styles.pillGreen}>
              <IconSymbol name="arrow.up.right" size={12} color="#30D158" />
              <Text style={styles.pillGreenText}> +12.5%</Text>
            </View>
            <Text style={styles.vsText}>vs last month</Text>
          </View>
          <View style={styles.bgIconContainer}>
            <IconSymbol name="squareshape.fill" size={60} color="rgba(48, 209, 88, 0.1)" />
          </View>
        </View>

        {/* 3 Pills */}
        <View style={styles.statsContainer}>
          <View style={[styles.statPill, { borderLeftColor: '#30D158' }]}>
            <View style={[styles.iconCircle, { borderColor: '#30D158' }]}>
              <IconSymbol name="arrow.down.left" size={16} color="#30D158" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>MONTHLY INCOME</Text>
              <Text style={styles.statValue}>{formatCurrency(income)}</Text>
            </View>
          </View>

          <View style={[styles.statPill, { borderLeftColor: '#FF453A' }]}>
            <View style={[styles.iconCircle, { borderColor: '#FF453A' }]}>
              <IconSymbol name="arrow.up.right" size={16} color="#FF453A" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>MONTHLY OUTFLOW</Text>
              <Text style={styles.statValue}>{formatCurrency(expense)}</Text>
            </View>
          </View>

          <View style={[styles.statPill, { borderLeftColor: '#8a2be2' }]}>
            <View style={[styles.iconCircle, { borderColor: '#8a2be2' }]}>
              <IconSymbol name="banknote.fill" size={16} color="#8fb1ff" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>PROJECTED SAVINGS</Text>
              <Text style={styles.statValue}>{formatCurrency(savings)}</Text>
            </View>
          </View>
        </View>

        {/* Monthly Allocation */}
        <View style={styles.allocationCard}>
          <Text style={styles.cardTitle}>Monthly Allocation</Text>
          <View style={styles.chartWrapper}>
            <PieChart
              donut
              innerRadius={70}
              radius={90}
              data={pieData}
              centerLabelComponent={() => {
                return (
                  <View style={{justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 12, color: '#8E8E93', fontWeight: 'bold'}}>TOTAL</Text>
                    <Text style={{fontSize: 20, color: 'white', fontWeight: 'bold'}}>{formatCurrency(expense)}</Text>
                  </View>
                );
              }}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.legendDot, {backgroundColor: '#8fb1ff'}]} />
                <Text style={styles.legendText}>Housing</Text>
              </View>
              <Text style={styles.legendValue}>40%</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.legendDot, {backgroundColor: '#ff6b6b'}]} />
                <Text style={styles.legendText}>Lifestyle</Text>
              </View>
              <Text style={styles.legendValue}>25%</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.legendDot, {backgroundColor: '#4ade80'}]} />
                <Text style={styles.legendText}>Investment</Text>
              </View>
              <Text style={styles.legendValue}>15%</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          
          {recentTransactions.map((tx, index) => {
            const dateStr = new Date(tx.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txIconBox}>
                   <IconSymbol name={tx.type === 'income' ? 'arrow.down' : 'bag.fill'} size={18} color="#8E8E93" />
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.txSubtext}>{tx.category || 'General'} • {dateStr}</Text>
                </View>
                <View style={styles.txAmounts}>
                  <Text style={[styles.txAmountText, { color: tx.type === 'income' ? '#30D158' : '#FFFFFF' }]}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                  <Text style={styles.txStatus}>COMPLETED</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fab}>
        <IconSymbol name="plus" size={24} color="#000000" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    color: '#8fb1ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#302522',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  totalLiquidityCard: {
    backgroundColor: '#121319',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionSubtitle: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  liquidityAmount: {
    color: '#30D158',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 44,
  },
  liquidityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillGreen: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillGreenText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vsText: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 12,
  },
  bgIconContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statPill: {
    backgroundColor: '#121319',
    borderRadius: 30,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1C24',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  allocationCard: {
    backgroundColor: '#121319',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  legendContainer: {
    gap: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  legendValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsCard: {
    backgroundColor: '#121319',
    borderRadius: 24,
    padding: 24,
    paddingBottom: 4,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  viewAllText: {
    color: '#8fb1ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  txDetails: {
    flex: 1,
  },
  txDescription: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  txSubtext: {
    color: '#8E8E93',
    fontSize: 12,
  },
  txAmounts: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  txStatus: {
    color: '#8E8E93',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8fb1ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  }
});
