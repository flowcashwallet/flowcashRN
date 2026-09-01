import { Button } from "@/components/atoms/Button";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { useWalletTransactions } from "@/features/wallet/hooks/useWalletTransactions";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { EntitySelectionModal } from "./transaction-form/EntitySelectionModal";
import { TransactionModal } from "./TransactionModal";

interface ManualMultiTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  visionEntities: VisionEntity[];
}

export const ManualMultiTransactionModal: React.FC<
  ManualMultiTransactionModalProps
> = ({ visible, onClose, visionEntities }) => {
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

  /** Cancelar el paso de fecha aborta el lote entero, como antes. */
  const cancelDateStep = () => {
    setShowDateModal(false);
    onClose();
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

      <BottomSheet
        visible={visible && showDateModal}
        onClose={cancelDateStep}
        title="Selecciona fecha"
      >
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display="default"
          onChange={(_, d) => {
            if (d) setSelectedDate(d.getTime());
          }}
        />

        <View style={styles.dateButtons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={cancelDateStep}
            style={styles.dateButton}
          />
          <Button
            title="Aceptar"
            onPress={() => {
              setShowDateModal(false);
              setShowTransactionModal(true);
            }}
            style={styles.dateButton}
          />
        </View>
      </BottomSheet>

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
  dateButtons: {
    marginTop: Spacing.m,
    flexDirection: "row",
    gap: Spacing.s,
  },
  dateButton: {
    flex: 1,
  },
});
