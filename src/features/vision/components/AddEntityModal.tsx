import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { AddEntityData } from "@/features/vision/hooks/useVisionOperations";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { fetchCryptoPrices } from "@/services/price/coingecko";
import { formatAmountInput, formatCurrency, parseAmount } from "@/utils/format";
import React, { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
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
                {initialEntity
                  ? "Editar"
                  : selectedType === "asset"
                    ? STRINGS.vision.addAsset
                    : STRINGS.vision.addLiability}
              </Typography>

              {selectedType === "asset" && (
                <View style={{ flexDirection: "row", marginBottom: Spacing.m }}>
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

              {selectedType === "liability" && (
                <View style={{ flexDirection: "row", marginBottom: Spacing.m }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: Spacing.s,
                      backgroundColor: !isCreditCard
                        ? colors.primary
                        : colors.surface,
                      alignItems: "center",
                      borderTopLeftRadius: BorderRadius.m,
                      borderBottomLeftRadius: BorderRadius.m,
                    }}
                    onPress={() => {
                      setIsCreditCard(false);
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{ color: !isCreditCard ? "#FFF" : colors.text }}
                    >
                      Deuda General
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: Spacing.s,
                      backgroundColor: isCreditCard
                        ? colors.primary
                        : colors.surface,
                      alignItems: "center",
                      borderTopRightRadius: BorderRadius.m,
                      borderBottomRightRadius: BorderRadius.m,
                    }}
                    onPress={() => {
                      setIsCreditCard(true);
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{ color: isCreditCard ? "#FFF" : colors.text }}
                    >
                      Tarjeta de Crédito
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}

              {isCreditCard && selectedType === "liability" ? (
                <>
                  <Input
                    label="Banco Emisor"
                    value={issuerBank}
                    onChangeText={setIssuerBank}
                    placeholder="Ej: BBVA, Santander..."
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: Spacing.s }}>
                      <Input
                        label="Día de Corte"
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
                    <View style={{ flex: 1, marginLeft: Spacing.s }}>
                      <Input
                        label="Día de Pago"
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
                        onPress={() => setSelectedCrypto(symbol)}
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
                              selectedCrypto === symbol ? "#FFF" : colors.text,
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
              {selectedType === "liability" && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: Spacing.m,
                  }}
                >
                  <View style={{ flex: 1, marginRight: Spacing.s }}>
                    <Input
                      label="Tasa Interés (%)"
                      value={interestRate}
                      onChangeText={setInterestRate}
                      placeholder="Ej: 18.5"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.s }}>
                    <Input
                      label="Pago Mínimo"
                      value={minimumPayment}
                      onChangeText={(t) =>
                        setMinimumPayment(formatAmountInput(t))
                      }
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

              <View style={styles.modalActions}>
                <Button
                  title={STRINGS.common.cancel}
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: Spacing.s }}
                />
                <Button
                  title={STRINGS.common.save}
                  onPress={handleSave}
                  loading={isSaving}
                  style={{ flex: 1, marginLeft: Spacing.s }}
                />
              </View>
            </TouchableOpacity>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
