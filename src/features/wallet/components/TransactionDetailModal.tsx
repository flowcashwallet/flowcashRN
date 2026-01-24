import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatAmountInput, formatCurrency } from "@/utils/format";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES = STRINGS.wallet.categories;

interface UpdateTransactionData {
  id: string;
  amount: string;
  description: string;
  type: "income" | "expense";
  category?: string | null;
  relatedEntityId?: string | null;
  oldAmount: number;
  oldEntityId?: string | null;
}

interface TransactionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onUpdate: (
    data: UpdateTransactionData,
  ) => Promise<boolean | undefined | void>;
  onDelete: (id: string) => void;
  visionEntities: VisionEntity[];
  isSaving: boolean;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  onClose,
  transaction,
  onUpdate,
  onDelete,
  visionEntities,
  isSaving,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] =
    useState(false);
  const [isEditEntityDropdownOpen, setIsEditEntityDropdownOpen] =
    useState(false);

  useEffect(() => {
    if (visible && transaction) {
      setEditDescription(transaction.description);
      setEditCategory(transaction.category || CATEGORIES[0]);
      setEditAmount(formatAmountInput(transaction.amount.toFixed(2)));
      setEditEntityId(transaction.relatedEntityId || null);
      setIsEditing(false);
      setIsEditCategoryDropdownOpen(false);
      setIsEditEntityDropdownOpen(false);
    }
  }, [visible, transaction]);

  const handleUpdate = async () => {
    if (!transaction) return;
    const success = await onUpdate({
      id: transaction.id,
      amount: editAmount,
      description: editDescription,
      type: transaction.type,
      category: editCategory,
      relatedEntityId: editEntityId,
      oldAmount: transaction.amount,
      oldEntityId: transaction.relatedEntityId,
    });
    if (success) {
      onClose();
    }
  };

  if (!transaction) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.modalContent,
            { backgroundColor: colors.background, paddingBottom: Spacing.l },
          ]}
        >
          <View style={{ alignItems: "center", marginBottom: Spacing.l }}>
            <Typography
              variant="h2"
              weight="bold"
              style={{ marginBottom: Spacing.s }}
            >
              {transaction.category?.split(" ")[0] ||
                (transaction.type === "income" ? "💰" : "💸")}
            </Typography>
            <Typography
              variant="h1"
              weight="bold"
              style={{
                color:
                  transaction.type === "income" ? colors.success : colors.error,
              }}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </Typography>
            <Typography
              variant="body"
              style={{
                color: colors.text,
                opacity: 0.7,
                marginTop: Spacing.xs,
              }}
            >
              {transaction.category}
            </Typography>
          </View>

          <View style={{ gap: Spacing.m, marginBottom: Spacing.xl }}>
            {isEditing ? (
              <>
                <View>
                  <Typography
                    variant="caption"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {STRINGS.wallet.amount}
                  </Typography>
                  <Input
                    value={editAmount}
                    onChangeText={(text) =>
                      setEditAmount(formatAmountInput(text))
                    }
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
                <View>
                  <Typography
                    variant="caption"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {STRINGS.wallet.description}
                  </Typography>
                  <Input
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder={STRINGS.wallet.description}
                  />
                </View>
                <View>
                  <Typography
                    variant="caption"
                    style={{
                      color: colors.text,
                      opacity: 0.6,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    {STRINGS.wallet.category}
                  </Typography>
                  <TouchableOpacity
                    onPress={() =>
                      setIsEditCategoryDropdownOpen(!isEditCategoryDropdownOpen)
                    }
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        marginBottom: isEditCategoryDropdownOpen
                          ? 0
                          : Spacing.m,
                        borderBottomLeftRadius: isEditCategoryDropdownOpen
                          ? 0
                          : BorderRadius.m,
                        borderBottomRightRadius: isEditCategoryDropdownOpen
                          ? 0
                          : BorderRadius.m,
                      },
                    ]}
                  >
                    <View style={styles.dropdownHeader}>
                      <Typography
                        variant="body"
                        style={{
                          color: editCategory
                            ? colors.text
                            : colors.text + "80",
                        }}
                      >
                        {editCategory || STRINGS.wallet.selectCategory}
                      </Typography>
                      <Typography variant="body" style={{ color: colors.text }}>
                        {isEditCategoryDropdownOpen ? "▲" : "▼"}
                      </Typography>
                    </View>
                  </TouchableOpacity>

                  {isEditCategoryDropdownOpen && (
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
                        {CATEGORIES.map((cat, index) => (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => {
                              setEditCategory(cat);
                              setIsEditCategoryDropdownOpen(false);
                            }}
                            style={{
                              padding: Spacing.m,
                              borderTopWidth: index > 0 ? 1 : 0,
                              borderTopColor: colors.border,
                            }}
                          >
                            <Typography
                              variant="body"
                              style={{ color: colors.text }}
                            >
                              {cat}
                            </Typography>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Entity Selector (Edit Mode) */}
                <View style={{ marginTop: Spacing.m }}>
                  <Typography
                    variant="caption"
                    style={{
                      color: colors.text,
                      opacity: 0.6,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    {STRINGS.vision.selectEntity}
                  </Typography>
                  <TouchableOpacity
                    onPress={() =>
                      setIsEditEntityDropdownOpen(!isEditEntityDropdownOpen)
                    }
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        marginBottom: isEditEntityDropdownOpen ? 0 : Spacing.m,
                        borderBottomLeftRadius: isEditEntityDropdownOpen
                          ? 0
                          : BorderRadius.m,
                        borderBottomRightRadius: isEditEntityDropdownOpen
                          ? 0
                          : BorderRadius.m,
                      },
                    ]}
                  >
                    <View style={styles.dropdownHeader}>
                      <Typography
                        variant="body"
                        style={{
                          color: editEntityId
                            ? colors.text
                            : colors.text + "80",
                        }}
                      >
                        {editEntityId
                          ? visionEntities.find((e) => e.id === editEntityId)
                              ?.name || STRINGS.vision.entityPlaceholder
                          : STRINGS.vision.entityPlaceholder}
                      </Typography>
                      <Typography variant="body" style={{ color: colors.text }}>
                        {isEditEntityDropdownOpen ? "▲" : "▼"}
                      </Typography>
                    </View>
                  </TouchableOpacity>

                  {isEditEntityDropdownOpen && (
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
                        <TouchableOpacity
                          onPress={() => {
                            setEditEntityId(null);
                            setIsEditEntityDropdownOpen(false);
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
                        {visionEntities
                          .filter((e) =>
                            transaction.type === "income"
                              ? e.type === "asset"
                              : e.type === "liability",
                          )
                          .map((entity, index) => (
                            <TouchableOpacity
                              key={entity.id}
                              onPress={() => {
                                setEditEntityId(entity.id);
                                setIsEditEntityDropdownOpen(false);
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
                          ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View>
                  <Typography
                    variant="caption"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {STRINGS.wallet.description}
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {transaction.description}
                  </Typography>
                </View>
                <View>
                  <Typography
                    variant="caption"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {STRINGS.wallet.category}
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {transaction.category || STRINGS.wallet.noCategory}
                  </Typography>
                </View>
                <View>
                  <Typography
                    variant="caption"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {STRINGS.wallet.date}
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {new Date(transaction.date).toLocaleString()}
                  </Typography>
                </View>
                <View>
                  <Typography
                    variant="caption"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {STRINGS.wallet.type}
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {transaction.type === "income"
                      ? STRINGS.wallet.income
                      : STRINGS.wallet.expense}
                  </Typography>
                </View>
                {transaction.relatedEntityId && (
                  <View>
                    <Typography
                      variant="caption"
                      style={{ color: colors.text, opacity: 0.6 }}
                    >
                      Asociado a
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {visionEntities.find(
                        (e) => e.id === transaction.relatedEntityId,
                      )?.name || "Entidad desconocida"}
                    </Typography>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: Spacing.m }}>
            {isEditing ? (
              <>
                <Button
                  title={STRINGS.common.cancel}
                  variant="ghost"
                  onPress={() => setIsEditing(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={STRINGS.common.save}
                  variant="primary"
                  loading={isSaving}
                  onPress={handleUpdate}
                  style={{
                    flex: 1,
                    backgroundColor:
                      transaction.type === "income"
                        ? colors.success
                        : colors.error,
                  }}
                />
              </>
            ) : (
              <>
                <Button
                  title={STRINGS.common.close}
                  variant="secondary"
                  onPress={onClose}
                  style={{ flex: 1 }}
                />
                <Button
                  title={STRINGS.common.edit}
                  variant="secondary"
                  onPress={() => setIsEditing(true)}
                  style={{ flex: 1, backgroundColor: colors.accent }}
                />
                <Button
                  title={STRINGS.common.delete}
                  variant="primary" // Should be destructive style ideally
                  style={{
                    flex: 1,
                    backgroundColor: colors.error,
                  }}
                  onPress={() => {
                    onClose();
                    setTimeout(() => onDelete(transaction.id), 500);
                  }}
                />
              </>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
