import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import {
  VisionEntity,
  addVisionEntity,
  deleteVisionEntity,
  fetchVisionEntities,
  updateVisionEntity,
} from "@/features/vision/visionSlice";
import {
  addTransaction,
  fetchTransactions,
} from "@/features/wallet/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { fetchCryptoPrices } from "@/services/price/coingecko";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput, formatCurrency, parseAmount } from "@/utils/format";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { PieChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export default function VisionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { entities, loading: visionLoading } = useSelector(
    (state: RootState) => state.vision,
  );
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { user } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<"asset" | "liability">(
    "asset",
  );
  const [selectedEntity, setSelectedEntity] = useState<VisionEntity | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"asset" | "liability">("asset");

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Crypto State
  const [isCrypto, setIsCrypto] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT">(
    "BTC",
  );
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoPrice, setCryptoPrice] = useState<number | null>(null);

  // Add Transaction Form State (inside Detail Modal)
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchVisionEntities(user.uid));
      dispatch(fetchTransactions(user.uid));
    }
  }, [dispatch, user]);

  const onRefresh = React.useCallback(() => {
    if (user?.uid) {
      setRefreshing(true);
      Promise.all([
        dispatch(fetchVisionEntities(user.uid)).unwrap(),
        dispatch(fetchTransactions(user.uid)).unwrap(),
      ])
        .then(() => setRefreshing(false))
        .catch(() => setRefreshing(false));
    }
  }, [dispatch, user]);

  const assets = entities.filter((e) => e.type === "asset");
  const liabilities = entities.filter((e) => e.type === "liability");

  const totalAssets = assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilities = liabilities.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const netWorth = totalAssets - totalLiabilities;
  const pieData = [
    { value: totalAssets || 1, color: colors.success }, // Success Green
    { value: totalLiabilities || 0, color: colors.error }, // Error Red
  ];

  const fetchPriceForSymbol = async (symbol: string) => {
    const coinIdMap: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      USDT: "tether",
    };

    const coinId = coinIdMap[symbol];
    const prices = await fetchCryptoPrices(coinId);

    if (prices && prices[coinId]) {
      const price = prices[coinId];
      setCryptoPrice(price);
      return price;
    }
    return null;
  };

  useEffect(() => {
    if (isCrypto && addModalVisible) {
      fetchPriceForSymbol(selectedCrypto);
    }
  }, [isCrypto, selectedCrypto, addModalVisible]);

  const handleCryptoAmountChange = (qty: string) => {
    const formattedQty = formatAmountInput(qty);
    setCryptoAmount(formattedQty);

    const numericQty = parseAmount(formattedQty);
    if (cryptoPrice && !isNaN(numericQty) && numericQty > 0) {
      const totalFiat = numericQty * cryptoPrice;
      setAmount(totalFiat.toString());
    } else {
      setAmount("");
    }
  };

  const handleUpdateCryptoPrice = async (entity: VisionEntity) => {
    if (!entity.cryptoSymbol || !entity.cryptoAmount) return;

    setIsSaving(true);
    const coinIdMap: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      USDT: "tether",
    };

    const coinId = coinIdMap[entity.cryptoSymbol];
    const prices = await fetchCryptoPrices(coinId);

    if (prices && prices[coinId]) {
      const price = prices[coinId];
      const newFiatAmount = entity.cryptoAmount * price;

      dispatch(
        updateVisionEntity({
          ...entity,
          amount: newFiatAmount,
        }),
      )
        .unwrap()
        .then((updatedEntity) => {
          setSelectedEntity(updatedEntity);
          Alert.alert(
            "Actualizado",
            `Precio actualizado a ${formatCurrency(price)} MXN`,
          );
        })
        .catch((error) => {
          Alert.alert(STRINGS.common.error, error);
        })
        .finally(() => setIsSaving(false));
    } else {
      setIsSaving(false);
      Alert.alert(STRINGS.common.error, "No se pudo obtener el precio actual.");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setAmount("");
    setCategory("");
    setIsCrypto(false);
    setCryptoAmount("");
    setCryptoPrice(null);
    setIsEditing(false);
    // Do not nullify selectedEntity here if we want to return to detail view,
    // but for now let's assume we close everything or just the add modal.
    // If we are editing, we probably want to keep selectedEntity to update the detail view?
    // The detail view updates automatically via Redux selector if we just close the edit modal.
  };

  const handleAddEntity = () => {
    if (!name || !amount || !user?.uid) return;
    setIsSaving(true);

    const commonData = {
      userId: user.uid,
      name,
      description,
      amount: parseAmount(amount),
      type: selectedType,
      category,
      isCrypto: selectedType === "asset" && isCrypto,
      ...(isCrypto && selectedType === "asset"
        ? {
            cryptoSymbol: selectedCrypto,
            cryptoAmount: parseAmount(cryptoAmount),
          }
        : {}),
    };

    if (isEditing && selectedEntity) {
      dispatch(
        updateVisionEntity({
          ...selectedEntity,
          ...commonData,
        }),
      )
        .unwrap()
        .then((updatedEntity) => {
          setAddModalVisible(false);
          setSelectedEntity(updatedEntity); // Update local state for detail view
          resetForm();
        })
        .catch((error) => {
          Alert.alert(STRINGS.common.error, error);
        })
        .finally(() => {
          setIsSaving(false);
        });
    } else {
      dispatch(
        addVisionEntity({
          ...commonData,
          createdAt: Date.now(),
        }),
      )
        .unwrap()
        .then(() => {
          setAddModalVisible(false);
          resetForm();
        })
        .catch((error) => {
          Alert.alert(STRINGS.common.error, error);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  };

  const handleAddTransactionToEntity = () => {
    if (
      !transactionAmount ||
      !transactionDescription ||
      !user?.uid ||
      !selectedEntity
    )
      return;
    setIsSaving(true);

    dispatch(
      addTransaction({
        userId: user.uid,
        amount: parseAmount(transactionAmount),
        description: transactionDescription,
        type: transactionType,
        date: Date.now(),
        relatedEntityId: selectedEntity.id,
        category: "Vision", // Default category for now
      }),
    )
      .unwrap()
      .then(() => {
        // Update Entity Amount
        const transAmount = parseAmount(transactionAmount);
        let newAmount = selectedEntity.amount;

        if (selectedEntity.type === "asset") {
          if (transactionType === "income") {
            newAmount += transAmount;
          } else {
            newAmount -= transAmount;
          }
        } else {
          // Liability
          if (transactionType === "income") {
            // Paying debt (Income/Payment) decreases Liability
            newAmount -= transAmount;
          } else {
            // Spending (Expense) increases Liability
            newAmount += transAmount;
          }
        }

        dispatch(
          updateVisionEntity({
            ...selectedEntity,
            amount: newAmount,
          }),
        );

        // Update local selected entity to reflect change immediately in modal
        setSelectedEntity({
          ...selectedEntity,
          amount: newAmount,
        });

        setShowAddTransaction(false);
        setTransactionAmount("");
        setTransactionDescription("");
        // Refresh transactions to show in list
        dispatch(fetchTransactions(user.uid));
      })
      .catch((error) => {
        Alert.alert(STRINGS.common.error, STRINGS.wallet.saveError + error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDeleteEntity = (id: string) => {
    Alert.alert(
      STRINGS.common.warning,
      STRINGS.wallet.deleteTransactionMessage,
      [
        { text: STRINGS.common.cancel, style: "cancel" },
        {
          text: STRINGS.common.delete,
          style: "destructive",
          onPress: () => {
            dispatch(deleteVisionEntity(id));
            if (selectedEntity?.id === id) {
              setDetailModalVisible(false);
              setSelectedEntity(null);
            }
          },
        },
      ],
    );
  };

  const renderEntityItem = ({ item }: { item: VisionEntity }) => {
    const isAsset = item.type === "asset";
    const indicatorColor = isAsset ? colors.success : colors.error;

    const renderRightActions = () => {
      return (
        <TouchableOpacity
          onPress={() => handleDeleteEntity(item.id)}
          style={{
            backgroundColor: colors.error,
            justifyContent: "center",
            alignItems: "center",
            width: 80,
            height: "100%",
            borderTopRightRadius: BorderRadius.l,
            borderBottomRightRadius: BorderRadius.l,
          }}
        >
          <IconSymbol name="trash.fill" size={24} color="#FFF" />
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        containerStyle={{ marginBottom: Spacing.m }}
      >
        <TouchableOpacity
          onPress={() => {
            if (item.type === "asset") {
              setTransactionType("income");
            } else {
              setTransactionType("expense");
            }
            setSelectedEntity(item);
            setDetailModalVisible(true);
          }}
          activeOpacity={0.7}
          style={{
            borderRadius: BorderRadius.l,
            backgroundColor: colors.surface, // Dark card background
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: Spacing.m,
              overflow: "hidden",
              borderRadius: BorderRadius.l,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isAsset
                  ? "rgba(0, 242, 96, 0.1)"
                  : "rgba(255, 65, 108, 0.1)",
                justifyContent: "center",
                alignItems: "center",
                marginRight: Spacing.m,
              }}
            >
              <IconSymbol
                name={isAsset ? "building.columns.fill" : "creditcard.fill"}
                size={20}
                color={indicatorColor}
              />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: colors.text }}
              >
                {item.name}
              </Typography>
              {item.category && (
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary, marginTop: 2 }}
                >
                  {item.category}
                </Typography>
              )}
            </View>

            {/* Amount */}
            <View style={{ alignItems: "flex-end", marginRight: Spacing.s }}>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: colors.text }}
              >
                {formatCurrency(item.amount)}
              </Typography>
              {item.description ? (
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary, maxWidth: 100 }}
                  numberOfLines={1}
                >
                  {item.description}
                </Typography>
              ) : null}
            </View>

            {/* Right Edge Indicator */}
            <View
              style={{
                width: 4,
                height: 24,
                backgroundColor: indicatorColor,
                borderRadius: 2,
              }}
            />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const getEntityTransactions = (entityId: string) => {
    return transactions.filter((t) => t.relatedEntityId === entityId);
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: Spacing.s, backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Dark Glassy Dashboard */}
        <View
          style={{
            backgroundColor: colors.surfaceHighlight,
            marginHorizontal: Spacing.m,
            marginBottom: Spacing.m,
            borderRadius: BorderRadius.xl,
            padding: Spacing.l,
            alignItems: "center",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              },
              android: { elevation: 10 },
            }),
          }}
        >
          <Typography
            variant="h3"
            style={{ color: colors.textSecondary, marginBottom: Spacing.xs }}
          >
            {STRINGS.vision.netWorth}
          </Typography>
          <Typography
            variant="h1"
            weight="bold"
            style={{
              color: colors.text,
              fontSize: 32,
              marginBottom: Spacing.l,
            }}
          >
            {formatCurrency(netWorth)}
          </Typography>

          <View style={{ alignItems: "center", marginBottom: Spacing.l }}>
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={60}
              innerCircleColor={colors.surfaceHighlight}
              centerLabelComponent={() => {
                return (
                  <View style={{ alignItems: "center" }}>
                    <Typography
                      variant="caption"
                      style={{ color: colors.textSecondary, fontSize: 10 }}
                    >
                      Balance
                    </Typography>
                  </View>
                );
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: Spacing.m,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.1)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.success,
                  marginRight: 8,
                }}
              />
              <View>
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary }}
                >
                  {STRINGS.vision.assets}
                </Typography>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: colors.text }}
                >
                  {formatCurrency(totalAssets)}
                </Typography>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.error,
                  marginRight: 8,
                }}
              />
              <View>
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary }}
                >
                  {STRINGS.vision.liabilities}
                </Typography>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: colors.text }}
                >
                  {formatCurrency(totalLiabilities)}
                </Typography>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs Selector - Clean Pills */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: Spacing.m,
            marginHorizontal: Spacing.m,
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.l,
            padding: 4,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: Spacing.s,
              alignItems: "center",
              borderRadius: BorderRadius.m,
              backgroundColor:
                activeTab === "asset" ? colors.surfaceActive : "transparent",
            }}
            onPress={() => setActiveTab("asset")}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{
                color:
                  activeTab === "asset" ? colors.text : colors.textSecondary,
              }}
            >
              {STRINGS.vision.assets}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: Spacing.s,
              alignItems: "center",
              borderRadius: BorderRadius.m,
              backgroundColor:
                activeTab === "liability"
                  ? colors.surfaceActive
                  : "transparent",
            }}
            onPress={() => setActiveTab("liability")}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{
                color:
                  activeTab === "liability"
                    ? colors.text
                    : colors.textSecondary,
              }}
            >
              {STRINGS.vision.liabilities}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Assets Section */}
        {activeTab === "asset" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: colors.text }}
              >
                {STRINGS.vision.assets}
              </Typography>
              <TouchableOpacity
                onPress={() => {
                  setSelectedType("asset");
                  resetForm(); // Reset and ensure isEditing is false
                  setAddModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <IconSymbol name="plus" size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
            {assets.length === 0 ? (
              <Typography
                variant="caption"
                style={{ fontStyle: "italic", color: colors.textSecondary }}
              >
                {STRINGS.vision.noAssets}
              </Typography>
            ) : (
              assets.map((item) => (
                <View key={item.id}>{renderEntityItem({ item })}</View>
              ))
            )}
          </View>
        )}

        {/* Liabilities Section */}
        {activeTab === "liability" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: colors.text }}
              >
                {STRINGS.vision.liabilities}
              </Typography>
              <TouchableOpacity
                onPress={() => {
                  setSelectedType("liability");
                  resetForm();
                  setAddModalVisible(true);
                }}
              >
                <View
                  style={[styles.addButton, { backgroundColor: colors.error }]}
                >
                  <IconSymbol name="plus" size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            </View>
            {liabilities.length === 0 ? (
              <Typography
                variant="caption"
                style={{ fontStyle: "italic", color: colors.textSecondary }}
              >
                {STRINGS.vision.noLiabilities}
              </Typography>
            ) : (
              liabilities.map((item) => (
                <View key={item.id}>{renderEntityItem({ item })}</View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Entity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.background },
                ]}
              >
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ marginBottom: Spacing.m }}
                >
                  {isEditing
                    ? "Editar"
                    : selectedType === "asset"
                      ? STRINGS.vision.addAsset
                      : STRINGS.vision.addLiability}
                </Typography>

                {selectedType === "asset" && (
                  <View
                    style={{ flexDirection: "row", marginBottom: Spacing.m }}
                  >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: Spacing.s,
                        backgroundColor: !isCrypto
                          ? colors.primary
                          : colors.surface,
                        alignItems: "center",
                        borderTopLeftRadius: BorderRadius.m,
                        borderBottomLeftRadius: BorderRadius.m,
                      }}
                      onPress={() => {
                        setIsCrypto(false);
                        setAmount("");
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ color: !isCrypto ? "#FFF" : colors.text }}
                      >
                        Dinero Fiat
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: Spacing.s,
                        backgroundColor: isCrypto
                          ? colors.primary
                          : colors.surface,
                        alignItems: "center",
                        borderTopRightRadius: BorderRadius.m,
                        borderBottomRightRadius: BorderRadius.m,
                      }}
                      onPress={() => {
                        setIsCrypto(true);
                        setAmount("");
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ color: isCrypto ? "#FFF" : colors.text }}
                      >
                        Criptomoneda
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )}

                {isCrypto && selectedType === "asset" ? (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-around",
                        marginBottom: Spacing.m,
                      }}
                    >
                      {(["BTC", "ETH", "USDT"] as const).map((symbol) => (
                        <TouchableOpacity
                          key={symbol}
                          onPress={() => {
                            setSelectedCrypto(symbol);
                            // useEffect will trigger fetchPriceForSymbol
                          }}
                          style={{
                            padding: Spacing.s,
                            borderRadius: BorderRadius.m,
                            backgroundColor:
                              selectedCrypto === symbol
                                ? colors.primary
                                : colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Typography
                            style={{
                              color:
                                selectedCrypto === symbol
                                  ? "#FFF"
                                  : colors.text,
                            }}
                          >
                            {symbol}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Input
                      label="Cantidad Cripto"
                      value={cryptoAmount}
                      onChangeText={handleCryptoAmountChange}
                      placeholder="0.00"
                      keyboardType="numeric"
                    />

                    {cryptoPrice && (
                      <Typography
                        variant="caption"
                        style={{ marginBottom: Spacing.m, textAlign: "center" }}
                      >
                        Precio actual: {formatCurrency(cryptoPrice)} MXN
                      </Typography>
                    )}
                  </>
                ) : null}

                <Input
                  label={STRINGS.vision.name}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej: Casa, Préstamo..."
                />

                <Typography
                  variant="caption"
                  style={{
                    color: colors.text,
                    marginBottom: Spacing.xs,
                    marginLeft: 4,
                  }}
                >
                  Categoría
                </Typography>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: Spacing.m }}
                >
                  {(selectedType === "asset"
                    ? STRINGS.vision.categories.asset
                    : STRINGS.vision.categories.liability
                  ).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={{
                        paddingHorizontal: Spacing.m,
                        paddingVertical: Spacing.s,
                        borderRadius: BorderRadius.l,
                        backgroundColor:
                          category === cat ? colors.primary : colors.surface,
                        marginRight: Spacing.s,
                        borderWidth: 1,
                        borderColor:
                          category === cat ? colors.primary : colors.border,
                      }}
                    >
                      <Typography
                        variant="body"
                        style={{
                          color: category === cat ? "#FFF" : colors.text,
                        }}
                      >
                        {cat}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Input
                  label={STRINGS.vision.description}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Opcional"
                />
                <Input
                  label={STRINGS.wallet.amount}
                  value={
                    isCrypto
                      ? amount
                        ? formatCurrency(Number(amount)).replace("$", "").trim()
                        : ""
                      : amount
                  }
                  onChangeText={(text) =>
                    !isCrypto && setAmount(formatAmountInput(text))
                  }
                  keyboardType="numeric"
                  placeholder="0.00"
                  editable={!isCrypto}
                />

                <View style={styles.modalActions}>
                  <Button
                    title={STRINGS.common.cancel}
                    variant="outline"
                    onPress={() => setAddModalVisible(false)}
                    style={{ flex: 1, marginRight: Spacing.s }}
                  />
                  <Button
                    title={STRINGS.common.save}
                    onPress={handleAddEntity}
                    loading={isSaving}
                    style={{ flex: 1, marginLeft: Spacing.s }}
                  />
                </View>
              </TouchableOpacity>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, height: "85%" },
            ]}
          >
            {selectedEntity && (
              <View style={{ flex: 1, padding: Spacing.m }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: Spacing.m,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Typography
                      variant="body"
                      style={{ color: colors.primary }}
                    >
                      {STRINGS.common.close}
                    </Typography>
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => {
                        setName(selectedEntity.name);
                        setDescription(selectedEntity.description || "");
                        setAmount(selectedEntity.amount.toString());
                        setCategory(selectedEntity.category || "");
                        setSelectedType(selectedEntity.type);
                        if (selectedEntity.isCrypto) {
                          setIsCrypto(true);
                          setSelectedCrypto(
                            (selectedEntity.cryptoSymbol as any) || "BTC",
                          );
                          setCryptoAmount(
                            selectedEntity.cryptoAmount?.toString() || "",
                          );
                        } else {
                          setIsCrypto(false);
                        }

                        setIsEditing(true);
                        setDetailModalVisible(false);
                        setAddModalVisible(true);
                      }}
                      style={{ marginRight: Spacing.m }}
                    >
                      <IconSymbol
                        name="pencil"
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteEntity(selectedEntity.id)}
                    >
                      <IconSymbol
                        name="trash.fill"
                        size={24}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Typography variant="h1" weight="bold">
                  {selectedEntity.name}
                </Typography>
                <Typography variant="h2" style={{ color: colors.primary }}>
                  {formatCurrency(selectedEntity.amount)}
                </Typography>

                {selectedEntity.isCrypto &&
                selectedEntity.cryptoAmount &&
                selectedEntity.cryptoSymbol ? (
                  <View
                    style={{ alignItems: "flex-start", marginTop: Spacing.s }}
                  >
                    <Typography variant="body" weight="bold">
                      {selectedEntity.cryptoAmount}{" "}
                      {selectedEntity.cryptoSymbol}
                    </Typography>
                    <Button
                      title="Actualizar Precio"
                      variant="outline"
                      onPress={() => handleUpdateCryptoPrice(selectedEntity)}
                      loading={isSaving}
                      style={{ marginTop: Spacing.xs, alignSelf: "flex-start" }}
                    />
                  </View>
                ) : null}

                {selectedEntity.description ? (
                  <Typography variant="body" style={{ marginTop: Spacing.xs }}>
                    {selectedEntity.description}
                  </Typography>
                ) : null}

                <View style={{ marginTop: Spacing.l, flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: Spacing.s,
                    }}
                  >
                    <Typography variant="h3" weight="bold">
                      {STRINGS.vision.transactionHistory}
                    </Typography>
                    <TouchableOpacity
                      onPress={() => setShowAddTransaction(!showAddTransaction)}
                    >
                      <IconSymbol
                        name={
                          showAddTransaction
                            ? "minus.circle.fill"
                            : "plus.circle.fill"
                        }
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  {showAddTransaction && (
                    <Card style={{ marginBottom: Spacing.m }}>
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{ marginBottom: Spacing.s }}
                      >
                        Nueva Transacción para {selectedEntity.name}
                      </Typography>
                      <View
                        style={{
                          flexDirection: "row",
                          marginBottom: Spacing.s,
                        }}
                      >
                        {selectedEntity.type === "asset" ? (
                          <Button
                            title={STRINGS.wallet.income}
                            variant="primary"
                            onPress={() => {}}
                            style={{ flex: 1 }}
                          />
                        ) : (
                          <Button
                            title={STRINGS.wallet.expense}
                            variant="primary"
                            onPress={() => {}}
                            style={{ flex: 1 }}
                          />
                        )}
                      </View>
                      <Input
                        placeholder={STRINGS.wallet.amount}
                        value={transactionAmount}
                        onChangeText={(t) =>
                          setTransactionAmount(formatAmountInput(t))
                        }
                        keyboardType="numeric"
                      />
                      <Input
                        placeholder={STRINGS.wallet.description}
                        value={transactionDescription}
                        onChangeText={setTransactionDescription}
                      />
                      <Button
                        title={STRINGS.common.save}
                        onPress={handleAddTransactionToEntity}
                        loading={isSaving}
                      />
                    </Card>
                  )}

                  <FlatList
                    data={getEntityTransactions(selectedEntity.id)}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <Card
                        style={{ marginBottom: Spacing.xs, padding: Spacing.s }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <View>
                            <Typography variant="body" weight="bold">
                              {item.description}
                            </Typography>
                            <Typography variant="caption">
                              {new Date(item.date).toLocaleDateString()}
                            </Typography>
                          </View>
                          <Typography
                            variant="body"
                            weight="bold"
                            style={{
                              color:
                                item.type === "income"
                                  ? colors.success
                                  : colors.error,
                            }}
                          >
                            {item.type === "income" ? "+" : "-"}{" "}
                            {formatCurrency(item.amount)}
                          </Typography>
                        </View>
                      </Card>
                    )}
                    ListEmptyComponent={
                      <Typography
                        variant="caption"
                        style={{ textAlign: "center", marginTop: Spacing.m }}
                      >
                        {STRINGS.wallet.noRecentTransactions}
                      </Typography>
                    }
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.m,
  },
  headerCard: {
    padding: Spacing.l,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    marginBottom: Spacing.l,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
    minHeight: 400,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
