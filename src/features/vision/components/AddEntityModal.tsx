import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { AddEntityData } from "@/features/vision/hooks/useVisionOperations";
import STRINGS from "@/i18n/es.json";
import { fetchCryptoPrices } from "@/services/price/coingecko";
import { formatAmountInput, formatCurrency, parseAmount } from "@/utils/format";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface AddEntityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    data: AddEntityData,
    isEditing: boolean,
    selectedEntity: VisionEntity | null,
  ) => Promise<any>;
  selectedType: "asset" | "liability";
  initialEntity: VisionEntity | null;
  isSaving: boolean;
}

export const AddEntityModal: React.FC<AddEntityModalProps> = ({
  visible,
  onClose,
  onSave,
  selectedType,
  initialEntity,
  isSaving,
}) => {
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [isCrypto, setIsCrypto] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT">(
    "BTC",
  );
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoPrice, setCryptoPrice] = useState<number | null>(null);

  // Credit Card States
  const [isCreditCard, setIsCreditCard] = useState(false);
  const [cutoffDate, setCutoffDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [issuerBank, setIssuerBank] = useState("");

  // Debt Logic
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");

  useEffect(() => {
    if (visible) {
      if (initialEntity) {
        setName(initialEntity.name);
        setDescription(initialEntity.description || "");
        setAmount(initialEntity.amount.toString());
        setCategory(initialEntity.category || "");

        // Debt Fields
        if (initialEntity.type === "liability") {
          setInterestRate(initialEntity.interestRate?.toString() || "");
          setMinimumPayment(initialEntity.minimumPayment?.toString() || "");
        } else {
          setInterestRate("");
          setMinimumPayment("");
        }

        // Asset - Crypto
        if (initialEntity.isCrypto) {
          setIsCrypto(true);
          setSelectedCrypto((initialEntity.cryptoSymbol as any) || "BTC");
          setCryptoAmount(initialEntity.cryptoAmount?.toString() || "");
        } else {
          setIsCrypto(false);
          setCryptoAmount("");
        }

        // Liability - Credit Card
        if (initialEntity.isCreditCard) {
          setIsCreditCard(true);
          setCutoffDate(initialEntity.cutoffDate?.toString() || "");
          setPaymentDate(initialEntity.paymentDate?.toString() || "");
          setIssuerBank(initialEntity.issuerBank || "");
        } else {
          setIsCreditCard(false);
          setCutoffDate("");
          setPaymentDate("");
          setIssuerBank("");
        }
      } else {
        setName("");
        setDescription("");
        setAmount("");
        setCategory("");
        setIsCrypto(false);
        setCryptoAmount("");

        // Reset Debt
        setInterestRate("");
        setMinimumPayment("");

        setIsCreditCard(false);
        setCutoffDate("");
        setPaymentDate("");
        setIssuerBank("");
      }
    }
  }, [visible, initialEntity]);

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
    if (isCrypto && visible) {
      fetchPriceForSymbol(selectedCrypto);
    }
  }, [isCrypto, selectedCrypto, visible]);

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

  const handleSave = () => {
    onSave(
      {
        name,
        description,
        amount,
        type: selectedType,
        category,
        isCrypto,
        cryptoSymbol: selectedCrypto,
        cryptoAmount,
        isCreditCard,
        cutoffDate,
        paymentDate,
        issuerBank,
        interestRate,
        minimumPayment,
      },
      !!initialEntity,
      initialEntity,
    );
  };

  /** Píldora de un toggle binario de dos segmentos (fiat/cripto, deuda/tarjeta). */
  const renderToggle = (
    options: readonly [
      { label: string; active: boolean; onPress: () => void },
      { label: string; active: boolean; onPress: () => void },
    ],
  ) => (
    <View
      style={[
        styles.toggleRow,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
        },
      ]}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.label}
          style={[
            styles.toggleSegment,
            option.active && { backgroundColor: colors.primary },
          ]}
          onPress={option.onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: option.active }}
        >
          <Typography
            variant="overline"
            muted={!option.active}
            style={option.active ? { color: colors.onPrimary } : undefined}
          >
            {option.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      avoidKeyboard
      title={
        initialEntity
          ? STRINGS.common.edit
          : selectedType === "asset"
            ? STRINGS.vision.addAsset
            : STRINGS.vision.addLiability
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {selectedType === "asset" &&
          renderToggle([
            {
              label: "Dinero fiat",
              active: !isCrypto,
              onPress: () => {
                setIsCrypto(false);
                setAmount("");
              },
            },
            {
              label: "Criptomoneda",
              active: isCrypto,
              onPress: () => {
                setIsCrypto(true);
                setAmount("");
              },
            },
          ])}

        {selectedType === "liability" &&
          renderToggle([
            {
              label: "Deuda general",
              active: !isCreditCard,
              onPress: () => setIsCreditCard(false),
            },
            {
              label: "Tarjeta de crédito",
              active: isCreditCard,
              onPress: () => setIsCreditCard(true),
            },
          ])}

        {isCreditCard && selectedType === "liability" ? (
          <>
            <Input
              label="Banco emisor"
              value={issuerBank}
              onChangeText={setIssuerBank}
              placeholder="Ej: BBVA, Santander..."
            />
            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Input
                  label="Día de corte"
                  value={cutoffDate}
                  onChangeText={(text) => {
                    // Allow only numbers 1-31
                    const num = parseInt(text);
                    if (text === "" || (num >= 1 && num <= 31)) {
                      setCutoffDate(text);
                    }
                  }}
                  placeholder="Ej: 5"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.field}>
                <Input
                  label="Día de pago"
                  value={paymentDate}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (text === "" || (num >= 1 && num <= 31)) {
                      setPaymentDate(text);
                    }
                  }}
                  placeholder="Ej: 25"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </>
        ) : null}

        {isCrypto && selectedType === "asset" ? (
          <>
            <View style={styles.cryptoRow}>
              {(["BTC", "ETH", "USDT"] as const).map((symbol) => {
                const selected = selectedCrypto === symbol;
                return (
                  <TouchableOpacity
                    key={symbol}
                    onPress={() => setSelectedCrypto(symbol)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surfaceHighlight,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Typography
                      variant="bodySmall"
                      weight={selected ? "semibold" : "regular"}
                      style={selected ? { color: colors.onPrimary } : undefined}
                    >
                      {symbol}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Cantidad cripto"
              value={cryptoAmount}
              onChangeText={handleCryptoAmountChange}
              placeholder="0.00"
              keyboardType="numeric"
            />

            {cryptoPrice && (
              <Typography variant="caption" muted style={styles.cryptoPrice}>
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

        <Typography variant="overline" muted style={styles.fieldLabel}>
          Categoría
        </Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.categoryRow}
          style={styles.categoryScroll}
        >
          {(selectedType === "asset"
            ? STRINGS.vision.categories.asset
            : STRINGS.vision.categories.liability
          ).map((cat) => {
            const selected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.surfaceHighlight,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Typography
                  variant="bodySmall"
                  weight={selected ? "semibold" : "regular"}
                  style={selected ? { color: colors.onPrimary } : undefined}
                >
                  {cat}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedType === "liability" && (
          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Input
                label="Tasa de interés (opcional)"
                value={interestRate}
                onChangeText={setInterestRate}
                placeholder="Ej: 18.5"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Input
                label="Pago mínimo (opcional)"
                value={minimumPayment}
                onChangeText={(t) => setMinimumPayment(formatAmountInput(t))}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

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

        <View style={styles.actionsRow}>
          <Button
            title={STRINGS.common.cancel}
            variant="outline"
            onPress={onClose}
            style={styles.actionButton}
          />
          <Button
            title={STRINGS.common.save}
            onPress={handleSave}
            loading={isSaving}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.m,
  },
  /**
   * Toggle binario. Se queda plano a propósito: vive **dentro** del panel del
   * sheet, que ya es la superficie de cristal, y no se apila cristal sobre
   * cristal.
   */
  toggleRow: {
    flexDirection: "row",
    borderRadius: BorderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    marginBottom: Spacing.m,
  },
  toggleSegment: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: "center",
    borderRadius: BorderRadius.round,
  },
  fieldRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
  },
  cryptoRow: {
    flexDirection: "row",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  cryptoPrice: {
    marginBottom: Spacing.m,
    textAlign: "center",
  },
  categoryScroll: {
    marginBottom: Spacing.m,
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  chip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.m,
  },
  actionButton: {
    flex: 1,
  },
});
