import { Button } from "@/components/atoms/Button";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { EntitySelectionModal } from "@/features/wallet/components/transaction-form/EntitySelectionModal";
import TransactionCarouselModal from "@/features/wallet/components/TransactionCarouselModal";
import { useWalletTransactions } from "@/features/wallet/hooks/useWalletTransactions";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { getTextFromFrame } from "expo-text-recognition";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

interface ReceiptScannerModalProps {
  visible: boolean;
  onClose: () => void;
  visionEntities: VisionEntity[];
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  visible,
  onClose,
  visionEntities,
}) => {
  const { addTransaction } = useWalletTransactions();

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [entityModalVisible, setEntityModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number>(Date.now());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [transactionCarouselVisible, setTransactionCarouselVisible] =
    useState(false);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permiso requerido",
          "Se requiere acceso a la galería para seleccionar recibos",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      const uri = (result as any).uri || (result as any)?.assets?.[0]?.uri;
      const base64 =
        (result as any).base64 || (result as any)?.assets?.[0]?.base64;
      if (!uri) return;

      try {
        if (!base64) {
          Alert.alert(
            "OCR no disponible",
            "La imagen no contiene base64. Intenta permitir la generación en la galería.",
          );
          return;
        }

        const visionResult = await getTextFromFrame(base64, true);
        const fullText = Array.isArray(visionResult)
          ? visionResult.join("\n")
          : (visionResult as any).text || String(visionResult);

        const parsed = parseRecognizedText(String(fullText));
        console.log("Recognized text:", fullText);
        console.log("Parsed candidates:", parsed);

        if (!parsed || parsed.length === 0) {
          Alert.alert(
            "No identificado",
            "No se encontraron montos en la imagen. Puedes ingresar manualmente.",
          );
          return;
        }

        setCandidates(parsed);
        setEntityModalVisible(true);
      } catch (err) {
        console.warn("Text recognition not available:", err);
        Alert.alert(
          "OCR no disponible",
          "Instala 'expo-text-recognition' y reconstruye la app para habilitar OCR local. Mientras tanto, puedes ingresar la transacción manualmente.",
        );
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const parseRecognizedText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const amountRegex =
      /(?:(?:\$|USD|MXR|€)\s?)?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/g;
    const amountTest =
      /(?:(?:\$|USD|MXR|€)\s?)?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/;

    const blacklist = [
      "pendiente",
      "total",
      "subtotal",
      "iva",
      "tarjeta",
      "saldo",
    ];

    const isBlacklisted = (s?: string) => {
      if (!s) return false;
      const low = s.toLowerCase();
      return blacklist.some((b) => low.includes(b));
    };

    const isPersonName = (s?: string) => {
      if (!s) return false;
      const parts = s.trim().split(/\s+/);
      const last = parts[parts.length - 1] || "";
      if (last.length === 1) return true;
      return false;
    };

    const candidates: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m: RegExpExecArray | null;
      amountRegex.lastIndex = 0;
      while ((m = amountRegex.exec(line)) !== null) {
        const matchedRaw = m[0] || "";
        if (!/(\$|USD|MXR|MXN|€)/i.test(matchedRaw)) {
          continue;
        }

        let raw = m[1];
        let cleaned = raw.replace(/\.(?=\d{3})/g, "").replace(/,/g, "");
        const value = parseFloat(cleaned);

        const hasLetters = (s?: string) => !!s && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(s);

        const sameLineCandidate = line.replace(m[0], "").trim();
        let description = "";
        if (
          sameLineCandidate &&
          hasLetters(sameLineCandidate) &&
          !amountTest.test(sameLineCandidate) &&
          !isBlacklisted(sameLineCandidate) &&
          !isPersonName(sameLineCandidate)
        ) {
          description = sameLineCandidate;
        } else {
          const above = [lines[i - 1], lines[i - 2], lines[i - 3]];
          const below = [lines[i + 1], lines[i + 2], lines[i + 3]];
          const pickFrom = (arr: (string | undefined)[]) => {
            for (const s of arr) {
              if (
                s &&
                hasLetters(s) &&
                !amountTest.test(s) &&
                !isBlacklisted(s) &&
                !isPersonName(s)
              ) {
                return s;
              }
            }
            return undefined;
          };

          description =
            pickFrom(above) ||
            pickFrom(below) ||
            sameLineCandidate ||
            lines[i - 1] ||
            lines[i + 1] ||
            "";
        }

        candidates.push({
          amount: value.toFixed(2),
          description: description.trim(),
        });
      }
    }

    const seen = new Set<string>();
    const filtered: any[] = [];
    for (const c of candidates) {
      const key = `${c.amount}|${(c.description || "").toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        filtered.push(c);
      }
    }

    return filtered;
  };

  /**
   * Aceptar y Cancelar hacen exactamente lo mismo en este paso (ambos avanzan
   * al carrusel). Se conserva tal cual: es lógica del flujo, no del envoltorio.
   * Anotado en `docs/refactor-plan.md` para que lo revise `arch-refactor`.
   */
  const leaveDateStep = () => {
    setShowDatePicker(false);
    setTransactionCarouselVisible(true);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Escanear recibo">
      <View style={styles.actions}>
        <Button title="Seleccionar foto" onPress={pickImage} />
        <Button
          title="Seleccionar entidad (opcional)"
          variant="ghost"
          onPress={() => setEntityModalVisible(true)}
        />
        <Button title="Cerrar" variant="ghost" onPress={onClose} />
      </View>

      <EntitySelectionModal
        visible={entityModalVisible}
        onClose={() => setEntityModalVisible(false)}
        onSelect={(id) => {
          setSelectedEntityId(id);
          setEntityModalVisible(false);
          setShowDatePicker(true);
        }}
        visionEntities={visionEntities}
        selectedEntityId={selectedEntityId}
      />

      <BottomSheet
        visible={showDatePicker}
        onClose={leaveDateStep}
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
            onPress={leaveDateStep}
            style={styles.dateButton}
          />
          <Button
            title="Aceptar"
            onPress={leaveDateStep}
            style={styles.dateButton}
          />
        </View>
      </BottomSheet>

      <TransactionCarouselModal
        visible={transactionCarouselVisible}
        onClose={() => {
          setTransactionCarouselVisible(false);
          onClose();
        }}
        candidates={candidates}
        visionEntities={visionEntities}
        initialRelatedEntityId={selectedEntityId}
        initialDate={selectedDate}
        onSaveCandidate={async (data: any) => {
          const success = await addTransaction({
            amount: data.amount,
            description: data.description,
            type: data.type,
            category: data.category || null,
            relatedEntityId: data.relatedEntityId || null,
            date: data.date || selectedDate,
          });
          return success;
        }}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.s,
  },
  dateButtons: {
    marginTop: Spacing.m,
    flexDirection: "row",
    gap: Spacing.s,
  },
  dateButton: {
    flex: 1,
  },
});
