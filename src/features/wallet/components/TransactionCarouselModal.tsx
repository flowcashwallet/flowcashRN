import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TransactionModal } from "./TransactionModal";

interface Candidate {
  amount: string;
  description?: string;
  initialType?: "income" | "expense";
  category?: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  candidates: Candidate[];
  visionEntities: VisionEntity[];
  initialDate?: number;
  initialRelatedEntityId?: string | null;
  onSaveCandidate: (data: {
    amount: string;
    description: string;
    type: "income" | "expense";
    category?: string | null;
    relatedEntityId?: string | null;
    date?: number;
  }) => Promise<boolean | undefined | void>;
}

const TransactionCarouselModal: React.FC<Props> = ({
  visible,
  onClose,
  candidates,
  visionEntities,
  initialRelatedEntityId,
  onSaveCandidate,
}) => {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const total = candidates.length;
  const current = candidates[index];

  const handleSave = async (data: any) => {
    setIsSaving(true);
    const payload = {
      amount: data.amount,
      description: data.description,
      type: data.type,
      category: data.category || current.category || null,
      relatedEntityId: data.relatedEntityId ?? initialRelatedEntityId ?? null,
    };

    const success = await onSaveCandidate(payload);
    setIsSaving(false);

    if (success) {
      if (index + 1 < total) {
        setIndex((prev) => prev + 1);
      } else {
        onClose();
      }
      return true;
    }
    return false;
  };

  const handleSkip = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  return (
    <>
      {visible && current && (
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <TransactionModal
            visible={true}
            onClose={onClose}
            onSave={handleSave}
            onSkip={handleSkip}
            initialType={current.initialType || "expense"}
            visionEntities={visionEntities}
            isSaving={isSaving}
            initialAmount={current.amount}
            initialDescription={current.description || ""}
            initialCategory={current.category ?? null}
            initialRelatedEntityId={initialRelatedEntityId ?? null}
            suppressAutoClose={true}
          />
        </View>
      )}
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.m,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default TransactionCarouselModal;
