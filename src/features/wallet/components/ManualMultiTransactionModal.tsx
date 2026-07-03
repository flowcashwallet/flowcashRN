import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { useWalletTransactions } from "@/features/wallet/hooks/useWalletTransactions";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { EntitySelectionModal } from "./EntitySelectionModal";
import { TransactionModal } from "./TransactionModal";

interface ManualMultiTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  visionEntities: VisionEntity[];
}

export const ManualMultiTransactionModal: React.FC<
  ManualMultiTransactionModalProps
> = ({ visible, onClose, visionEntities }) => {
  const { colors } = useTheme();
  const { addTransaction } = useWalletTransactions();

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(Date.now());

  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const selectingEntityRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setShowEntityModal(false);
      setShowDateModal(false);
      setShowTransactionModal(false);
      setIsSaving(false);
      setFormKey(0);
      selectingEntityRef.current = false;
      return;
    }

    // Start the manual batch flow by asking entity first.
    setShowEntityModal(true);
  }, [visible]);

  const saveTransaction = async (data: {
    amount: string;
    description: string;
    type: "income" | "expense";
    category?: string | null;
    relatedEntityId?: string | null;
    date?: number;
  }) => {
    setIsSaving(true);
    try {
      const success = await addTransaction({
        amount: data.amount,
        description: data.description,
        type: data.type,
        category: data.category || null,
        relatedEntityId: data.relatedEntityId ?? selectedEntityId ?? null,
        date: data.date ?? selectedDate,
      });
      return success;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async (data: {
    amount: string;
    description: string;
    type: "income" | "expense";
    category?: string | null;
    relatedEntityId?: string | null;
    date?: number;
  }) => {
    const success = await saveTransaction(data);
    if (success) {
      setFormKey((prev) => prev + 1);
    }
    return success;
  };

  const handleSaveAndExit = async (data: {
    amount: string;
    description: string;
    type: "income" | "expense";
    category?: string | null;
    relatedEntityId?: string | null;
    date?: number;
  }) => {
    const success = await saveTransaction(data);
    if (success) {
      onClose();
    }
    return success;
  };

  return (
    <>
      <EntitySelectionModal
        visible={visible && showEntityModal}
        onClose={() => {
          setShowEntityModal(false);
          // EntitySelectionModal calls onClose after onSelect.
          // Ignore that close path when user actually selected an entity.
          if (selectingEntityRef.current) {
            selectingEntityRef.current = false;
            return;
          }
          onClose();
        }}
        onSelect={(id) => {
          selectingEntityRef.current = true;
          setSelectedEntityId(id);
          setShowEntityModal(false);
          setShowDateModal(true);
        }}
        visionEntities={visionEntities}
        selectedEntityId={selectedEntityId}
      />

      {visible && showDateModal && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.dateOverlay}>
            <View
              style={[styles.dateCard, { backgroundColor: colors.background }]}
            >
              <Typography
                variant="h3"
                weight="bold"
                style={{ marginBottom: Spacing.m }}
              >
                Selecciona fecha
              </Typography>

              <DateTimePicker
                value={new Date(selectedDate)}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  if (d) setSelectedDate(d.getTime());
                }}
              />

              <View style={styles.dateButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowDateModal(false);
                    onClose();
                  }}
                  style={[
                    styles.dateButton,
                    {
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: "transparent",
                    },
                  ]}
                >
                  <Typography variant="body" style={{ color: colors.text }}>
                    Cancelar
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowDateModal(false);
                    setShowTransactionModal(true);
                  }}
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Typography
                    variant="body"
                    style={{ color: "white", fontWeight: "600" }}
                  >
                    Aceptar
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {visible && showTransactionModal && (
        <TransactionModal
          key={formKey}
          visible={true}
          onClose={onClose}
          onSave={handleSaveAndExit}
          onSaveAndContinue={handleSaveAndContinue}
          onSaveAndExit={handleSaveAndExit}
          showDualSaveButtons={true}
          initialType="expense"
          visionEntities={visionEntities}
          isSaving={isSaving}
          initialAmount=""
          initialDescription=""
          initialCategory={null}
          initialRelatedEntityId={selectedEntityId}
          initialDate={selectedDate}
          suppressAutoClose={true}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  dateOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.m,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  dateCard: {
    borderRadius: 12,
    padding: Spacing.l,
  },
  dateButtons: {
    marginTop: Spacing.m,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.s,
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
