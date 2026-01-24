import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { fetchCategories } from "@/features/wallet/data/categoriesSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput } from "@/utils/format";
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
}

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: TransactionData) => Promise<boolean | undefined | void>;
  initialType: "income" | "expense";
  visionEntities: VisionEntity[];
  isSaving: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  onClose,
  onSave,
  initialType,
  visionEntities,
  isSaving,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories } = useSelector((state: RootState) => state.categories);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

  useEffect(() => {
    if (visible && user?.uid && categories.length === 0) {
      dispatch(fetchCategories(user.uid));
    }
  }, [visible, user, dispatch, categories.length]);

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount("");
      setDescription("");
      setSelectedCategory(null);
      setSelectedEntityId(null);
      setIsCategoryDropdownOpen(false);
      setIsEntityDropdownOpen(false);
    }
  }, [visible, initialType]);

  const handleSave = async () => {
    const success = await onSave({
      amount,
      description,
      type,
      category: selectedCategory,
      relatedEntityId: selectedEntityId,
    });
    if (success) {
      onClose();
    }
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmountInput(text));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
              <Typography
                variant="h3"
                weight="bold"
                style={{ marginBottom: Spacing.l }}
              >
                {type === "income"
                  ? STRINGS.wallet.newIncome
                  : STRINGS.wallet.newExpense}
              </Typography>

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

              <TouchableOpacity
                onPress={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
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
                      color: selectedCategory
                        ? colors.text
                        : colors.text + "80",
                    }}
                  >
                    {selectedCategory || STRINGS.wallet.selectCategory}
                  </Typography>
                  <Typography variant="body" style={{ color: colors.text }}>
                    {isCategoryDropdownOpen ? "▲" : "▼"}
                  </Typography>
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
                  <ScrollView nestedScrollEnabled>
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
                {STRINGS.vision.selectEntity}
              </Typography>

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
                  <ScrollView nestedScrollEnabled>
                    {visionEntities.filter((e) =>
                      type === "income"
                        ? e.type === "asset"
                        : e.type === "liability",
                    ).length === 0 ? (
                      <Typography
                        variant="body"
                        style={{ padding: Spacing.m, color: colors.icon }}
                      >
                        {type === "income"
                          ? "No hay activos disponibles"
                          : "No hay pasivos disponibles"}
                      </Typography>
                    ) : (
                      visionEntities
                        .filter((e) =>
                          type === "income"
                            ? e.type === "asset"
                            : e.type === "liability",
                        )
                        .map((entity, index) => (
                          <TouchableOpacity
                            key={entity.id}
                            onPress={() => {
                              setSelectedEntityId(entity.id);
                              setIsEntityDropdownOpen(false);
                            }}
                            style={{
                              padding: Spacing.m,
                              borderTopWidth: index > 0 ? 1 : 0,
                              borderTopColor: colors.border,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="body"
                                style={{ color: colors.text }}
                              >
                                {entity.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                style={{
                                  color:
                                    entity.type === "asset"
                                      ? colors.success
                                      : colors.error,
                                }}
                              >
                                {entity.type === "asset"
                                  ? STRINGS.vision.assets
                                  : STRINGS.vision.liabilities}
                              </Typography>
                            </View>
                          </TouchableOpacity>
                        ))
                    )}
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalButtons}>
                <Button
                  title={STRINGS.common.cancel}
                  variant="ghost"
                  onPress={onClose}
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
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
    borderBottomLeftRadius: BorderRadius.m,
    borderBottomRightRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    maxHeight: 200,
  },
});
