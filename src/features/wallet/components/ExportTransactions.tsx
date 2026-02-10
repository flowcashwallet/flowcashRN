import { endpoints } from "@/services/api";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";

export const ExportTransactions = ({
  type = "transactions",
}: {
  type?: "transactions" | "vision";
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { token } = useSelector((state: RootState) => state.auth);

  const handleExport = async (format: "excel" | "pdf") => {
    if (!token) return;

    try {
      setIsExporting(true);

      let url;
      let filenamePrefix;

      if (type === "vision") {
        url =
          format === "excel"
            ? endpoints.wallet.exportVisionExcel
            : endpoints.wallet.exportVisionPdf;
        filenamePrefix = "balance_sheet";
      } else {
        url =
          format === "excel"
            ? endpoints.wallet.exportExcel
            : endpoints.wallet.exportPdf;
        filenamePrefix = "transactions";
      }

      const extension = format === "excel" ? "xlsx" : "pdf";
      const filename = `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.${extension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      console.log(`Downloading ${format} to ${fileUri}...`);

      const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadRes.status !== 200) {
        console.error("Export failed with status:", downloadRes.status);
        console.error("Headers:", downloadRes.headers);
        throw new Error(`Download failed (Status ${downloadRes.status})`);
      }

      console.log("Download complete, sharing...");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            format === "excel"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/pdf",
          UTI:
            format === "excel" ? "com.microsoft.excel.xlsx" : "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", `File saved to ${fileUri}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export transactions. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const showExportOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Export to Excel", "Export to PDF"],
          cancelButtonIndex: 0,
          userInterfaceStyle: "light",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleExport("excel");
          if (buttonIndex === 2) handleExport("pdf");
        },
      );
    } else {
      Alert.alert(
        type === "vision" ? "Export Balance Sheet" : "Export Transactions",
        "Choose a format",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Excel", onPress: () => handleExport("excel") },
          { text: "PDF", onPress: () => handleExport("pdf") },
        ],
        { cancelable: true },
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={showExportOptions}
      disabled={isExporting}
      style={styles.button}
    >
      {isExporting ? (
        <ActivityIndicator size="small" color="#4F46E5" />
      ) : (
        <Ionicons name="share-outline" size={24} color="#4F46E5" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
  },
});
