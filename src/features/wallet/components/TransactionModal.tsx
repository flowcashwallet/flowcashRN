import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { fetchCategories } from "@/features/wallet/data/categoriesSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput } from "@/utils/format";
import { predictCategory } from "@/utils/smartCategorization";
import { useRouter } from "expo-router";
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
import { useDispatch, useSelector } from "react-redux";

interface TransactionData {
  amount: string;
  description: string;
  type: "income" | "expense";
  category?: string | null;
  relatedEntityId?: string | null;
  date?: number;
}

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: TransactionData) => Promise<boolean | undefined | void>;
  onSaveAndContinue?: (
    data: TransactionData,
  ) => Promise<boolean | undefined | void>;
  onSaveAndExit?: (
    data: TransactionData,
  ) => Promise<boolean | undefined | void>;
  initialType: "income" | "expense";
  visionEntities: VisionEntity[];
  isSaving: boolean;
  initialAmount?: string;
  initialDescription?: string;
  initialCategory?: string | null;
  initialRelatedEntityId?: string | null;
  suppressAutoClose?: boolean;
  initialDate?: number;
  onSkip?: () => void;
  showDualSaveButtons?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  onClose,
  onSave,
  onSaveAndContinue,
  onSaveAndExit,
  initialType,
  visionEntities,
  isSaving,
  initialAmount,
  initialDescription,
  initialCategory,
  initialRelatedEntityId,
  suppressAutoClose = false,
  initialDate,
  onSkip,
  showDualSaveButtons = false,
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { colors } = useTheme();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [manualCategorySelection, setManualCategorySelection] =
    useState<boolean>(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");

  useEffect(() => {
    if (visible && user?.id && categories.length === 0) {
      dispatch(fetchCategories(user.id.toString()));
    }
  }, [visible, user, dispatch, categories.length]);

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount(initialAmount ?? "");
      setDescription(initialDescription ?? "");
      setSelectedCategory(initialCategory ?? null);
      setManualCategorySelection(!!initialCategory);
      setSelectedEntityId(initialRelatedEntityId ?? null);
      setIsCategoryDropdownOpen(false);
      setIsEntityDropdownOpen(false);
    }
  }, [
    visible,
    initialType,
    initialAmount,
    initialDescription,
    initialCategory,
    initialRelatedEntityId,
  ]);

  // Transactions for frequent categories
  const { transactions } = useSelector((state: RootState) => state.wallet);

  const frequentCategories = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [] as string[];
    const categoryCounts: Record<string, number> = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        if (t.category) {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        }
      });
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
  }, [transactions, type]);

  // Smart categorization (local fallback only)
  useEffect(() => {
    if (manualCategorySelection) return;
    if (!description || description.trim().length < 2) return;

    const timeoutId = setTimeout(() => {
      try {
        const predicted = predictCategory(description);
        if (predicted && selectedCategory !== predicted) {
          setSelectedCategory(predicted);
        }
      } catch (err) {
        console.log("Smart categorization (local) failed:", err);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [description, manualCategorySelection, selectedCategory]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setManualCategorySelection(true);
  };

  const handleSave = async () => {
    const payload = {
      amount,
      description,
      type,
      category: selectedCategory,
      relatedEntityId: selectedEntityId,
      date: initialDate ?? Date.now(),
    };

    const success = await onSave(payload);
    if (success && !suppressAutoClose) {
      onClose();
    }
  };

  const handleSaveAndContinue = async () => {
    const payload = {
      amount,
      description,
      type,
      category: selectedCategory,
      relatedEntityId: selectedEntityId,
      date: initialDate ?? Date.now(),
    };

    const success = await (onSaveAndContinue
      ? onSaveAndContinue(payload)
      : onSave(payload));
    return success;
  };

  const handleSaveAndExit = async () => {
    const payload = {
      amount,
      description,
      type,
      category: selectedCategory,
      relatedEntityId: selectedEntityId,
      date: initialDate ?? Date.now(),
    };

    const success = await (onSaveAndExit
      ? onSaveAndExit(payload)
      : onSave(payload));
    if (success) {
      onClose();
    }
    return success;
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmountInput(text));
  };

  const InnerContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <TouchableOpacity
        style={{ flex: 1, justifyContent: "flex-end" }}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.l,
              }}
            >
              <Typography variant="h3" weight="bold">
                {type === "income"
                  ? STRINGS.wallet.newIncome
                  : STRINGS.wallet.newExpense}
              </Typography>
              {onSkip && (
                <TouchableOpacity
                  onPress={onSkip}
                  style={{ padding: Spacing.s }}
                >
                  <Typography
                    variant="body"
                    style={{ color: colors.textSecondary }}
                  >
                    Saltar
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label={STRINGS.wallet.description}
              placeholder={STRINGS.wallet.descriptionPlaceholder}
              value={description}
              onChangeText={setDescription}
            />

            <Input
              label={STRINGS.wallet.amount}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
            />

            <Typography
              variant="caption"
              style={{ marginBottom: Spacing.xs, color: colors.text }}
            >
              {STRINGS.wallet.category}
            </Typography>

            {frequentCategories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: Spacing.s }}
                contentContainerStyle={{ gap: 8 }}
              >
                {frequentCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => handleCategorySelect(cat)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedCategory === cat
                            ? colors.primary
                            : colors.surface,
                      },
                    ]}
                  >
                    <Typography
                      variant="body"
                      style={{
                        color: selectedCategory === cat ? "white" : colors.text,
                      }}
                    >
                      {cat}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginBottom: isCategoryDropdownOpen ? 0 : Spacing.m,
                  borderBottomLeftRadius: isCategoryDropdownOpen
                    ? 0
                    : BorderRadius.m,
                  borderBottomRightRadius: isCategoryDropdownOpen
                    ? 0
                    : BorderRadius.m,
                },
              ]}
            >
              <View style={styles.dropdownHeader}>
                <Typography
                  variant="body"
                  style={{
                    color: selectedCategory ? colors.text : colors.text + "80",
                    flex: 1,
                  }}
                >
                  {selectedCategory || STRINGS.wallet.selectCategory}
                </Typography>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      router.push("/wallet/categories");
                    }}
                    style={{ marginRight: Spacing.s, padding: 4 }}
                  >
                    <IconSymbol name="pencil" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Typography variant="body" style={{ color: colors.text }}>
                    {isCategoryDropdownOpen ? "▲" : "▼"}
                  </Typography>
                </View>
              </View>
            </TouchableOpacity>

            {isCategoryDropdownOpen && (
              <View
                style={[
                  styles.dropdownList,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <ScrollView
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled
                >
                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        setSelectedCategory(cat.name);
                        setIsCategoryDropdownOpen(false);
                      }}
                      style={{
                        padding: Spacing.m,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Typography variant="body">{cat.name}</Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Entity Selector */}
            <Typography
              variant="caption"
              style={{ marginBottom: Spacing.xs, color: colors.text }}
            >
              {STRINGS.vision.selectEntity}{" "}
              {visionEntities.find((e) => e.id === selectedEntityId)?.name ||
                "..."}
            </Typography>

            {!selectedEntityId && (
              <TouchableOpacity
                onPress={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginBottom: isEntityDropdownOpen ? 0 : Spacing.m,
                    borderBottomLeftRadius: isEntityDropdownOpen
                      ? 0
                      : BorderRadius.m,
                    borderBottomRightRadius: isEntityDropdownOpen
                      ? 0
                      : BorderRadius.m,
                  },
                ]}
              >
                <View style={styles.dropdownHeader}>
                  <Typography
                    variant="body"
                    style={{
                      color: selectedEntityId
                        ? colors.text
                        : colors.text + "80",
                    }}
                  >
                    {selectedEntityId
                      ? visionEntities.find((e) => e.id === selectedEntityId)
                          ?.name || STRINGS.vision.entityPlaceholder
                      : STRINGS.vision.entityPlaceholder}
                  </Typography>
                  <Typography variant="body" style={{ color: colors.text }}>
                    {isEntityDropdownOpen ? "▲" : "▼"}
                  </Typography>
                </View>
              </TouchableOpacity>
            )}

            {isEntityDropdownOpen && (
              <View
                style={[
                  styles.dropdownList,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <View style={{ padding: Spacing.s }}>
                  <Input
                    placeholder="Buscar activo/pasivo..."
                    value={entitySearchQuery}
                    onChangeText={setEntitySearchQuery}
                    style={{ marginBottom: 0 }}
                  />
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled
                  style={{ maxHeight: 200 }}
                >
                  {(() => {
                    const filteredEntities = visionEntities.filter((e) =>
                      e.name
                        .toLowerCase()
                        .includes(entitySearchQuery.toLowerCase()),
                    );

                    if (filteredEntities.length === 0) {
                      return (
                        <Typography
                          variant="body"
                          style={{ padding: Spacing.m, color: colors.icon }}
                        >
                          No se encontraron resultados
                        </Typography>
                      );
                    }

                    const assets = filteredEntities.filter(
                      (e) => e.type === "asset",
                    );
                    const liabilities = filteredEntities.filter(
                      (e) => e.type === "liability",
                    );

                    return (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedEntityId(null);
                            setIsEntityDropdownOpen(false);
                          }}
                          style={{
                            padding: Spacing.m,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <Typography
                            variant="body"
                            style={{
                              color: colors.text,
                              fontStyle: "italic",
                            }}
                          >
                            Ninguno
                          </Typography>
                        </TouchableOpacity>

                        {assets.length > 0 && (
                          <>
                            <View
                              style={{
                                padding: Spacing.s,
                                backgroundColor: colors.surfaceHighlight,
                              }}
                            >
                              <Typography
                                variant="caption"
                                weight="bold"
                                style={{ color: colors.textSecondary }}
                              >
                                ACTIVOS
                              </Typography>
                            </View>
                            {assets.map((entity) => (
                              <TouchableOpacity
                                key={entity.id}
                                onPress={() => {
                                  setSelectedEntityId(entity.id);
                                  setIsEntityDropdownOpen(false);
                                }}
                                style={{
                                  padding: Spacing.m,
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <Typography variant="body">
                                  {entity.name}
                                </Typography>
                              </TouchableOpacity>
                            ))}
                          </>
                        )}

                        {liabilities.length > 0 && (
                          <>
                            <View
                              style={{
                                padding: Spacing.s,
                                backgroundColor: colors.surfaceHighlight,
                              }}
                            >
                              <Typography
                                variant="caption"
                                weight="bold"
                                style={{ color: colors.textSecondary }}
                              >
                                PASIVOS
                              </Typography>
                            </View>
                            {liabilities.map((entity) => (
                              <TouchableOpacity
                                key={entity.id}
                                onPress={() => {
                                  setSelectedEntityId(entity.id);
                                  setIsEntityDropdownOpen(false);
                                }}
                                style={{
                                  padding: Spacing.m,
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <Typography variant="body">
                                  {entity.name}
                                </Typography>
                              </TouchableOpacity>
                            ))}
                          </>
                        )}
                      </>
                    );
                  })()}
                </ScrollView>
              </View>
            )}

            {showDualSaveButtons ? (
              <View style={styles.modalButtonsDual}>
                <Button
                  title="Guardar y continuar"
                  loading={isSaving}
                  onPress={handleSaveAndContinue}
                  style={{
                    backgroundColor:
                      type === "income" ? colors.success : colors.error,
                  }}
                />
                <Button
                  title="Guardar y salir"
                  loading={isSaving}
                  onPress={handleSaveAndExit}
                  style={{
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <Button
                  title={STRINGS.common.cancel}
                  variant="ghost"
                  onPress={() => {
                    if (typeof onSkip === "function") {
                      onSkip();
                    } else {
                      onClose();
                    }
                  }}
                  style={{ flex: 1, marginRight: Spacing.s }}
                />
                <Button
                  title={STRINGS.common.save}
                  loading={isSaving}
                  onPress={handleSave}
                  style={{
                    flex: 1,
                    marginLeft: Spacing.s,
                    backgroundColor:
                      type === "income" ? colors.success : colors.error,
                  }}
                />
              </View>
            )}
          </TouchableOpacity>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      {InnerContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.l,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
  modalButtonsDual: {
    marginTop: Spacing.m,
    gap: Spacing.s,
  },
  dropdown: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    maxHeight: 200,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
