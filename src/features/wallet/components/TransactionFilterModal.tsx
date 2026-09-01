import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Category } from "@/features/wallet/data/categoriesSlice";
import STRINGS from "@/i18n/es.json";
import { RootState } from "@/store/store";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { clearCategoryPickerSelection } from "../data/walletUiSlice";

interface TransactionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  entities: VisionEntity[];
  currentFilters: {
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
    paymentType:
      | "credit_card"
      | "debit_card"
      | "cash"
      | "transfer"
      | "payroll"
      | null;
    dateMode: "none" | "single" | "range";
    date: number | null;
    dateFrom: number | null;
    dateTo: number | null;
  };
  onApply: (filters: {
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
    paymentType:
      | "credit_card"
      | "debit_card"
      | "cash"
      | "transfer"
      | "payroll"
      | null;
    dateMode: "none" | "single" | "range";
    date: number | null;
    dateFrom: number | null;
    dateTo: number | null;
  }) => void;
  onClear: () => void;
}

export const TransactionFilterModal: React.FC<TransactionFilterModalProps> = ({
  visible,
  onClose,
  categories,
  entities,
  currentFilters,
  onApply,
  onClear,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  // Antes leía `useColorScheme()` directo, saltándose el override manual del
  // usuario; ahora sale del contexto de tema como el resto de la app.
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    currentFilters.category,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    currentFilters.entityId,
  );
  const [selectedType, setSelectedType] = useState<"income" | "expense" | null>(
    currentFilters.type,
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "credit_card" | "debit_card" | "cash" | "transfer" | "payroll" | null
  >(currentFilters.paymentType);

  const [dateMode, setDateMode] = useState<"none" | "single" | "range">(
    currentFilters.dateMode,
  );
  const [selectedDate, setSelectedDate] = useState<number | null>(
    currentFilters.date,
  );
  const [selectedFromDate, setSelectedFromDate] = useState<number | null>(
    currentFilters.dateFrom,
  );
  const [selectedToDate, setSelectedToDate] = useState<number | null>(
    currentFilters.dateTo,
  );
  const [activeDatePicker, setActiveDatePicker] = useState<
    "single" | "from" | "to" | null
  >(null);

  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);
  const categoryPickerSelection = useSelector(
    (state: RootState) => state.walletUi.categoryPickerSelection,
  );

  useEffect(() => {
    if (visible) {
      setSelectedCategory(currentFilters.category);
      setSelectedEntityId(currentFilters.entityId);
      setSelectedType(currentFilters.type);
      setSelectedPaymentType(currentFilters.paymentType);
      setDateMode(currentFilters.dateMode);
      setSelectedDate(currentFilters.date);
      setSelectedFromDate(currentFilters.dateFrom);
      setSelectedToDate(currentFilters.dateTo);
      setActiveDatePicker(null);
      setIsEntityDropdownOpen(false);
      setIsPaymentTypeDropdownOpen(false);
    }
  }, [visible, currentFilters]);

  useEffect(() => {
    if (!visible) return;
    if (!categoryPickerSelection) return;
    if (categoryPickerSelection.target !== "transactionFilter") return;
    setSelectedCategory(categoryPickerSelection.value);
    dispatch(clearCategoryPickerSelection());
  }, [categoryPickerSelection, dispatch, visible]);

  const handleApply = () => {
    const normalizedDateMode =
      dateMode === "single" && !selectedDate
        ? "none"
        : dateMode === "range" && !selectedFromDate && !selectedToDate
          ? "none"
          : dateMode;

    onApply({
      category: selectedCategory,
      entityId: selectedEntityId,
      type: selectedType,
      paymentType: selectedPaymentType,
      dateMode: normalizedDateMode,
      date: normalizedDateMode === "single" ? selectedDate : null,
      dateFrom: normalizedDateMode === "range" ? selectedFromDate : null,
      dateTo: normalizedDateMode === "range" ? selectedToDate : null,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory(null);
    setSelectedEntityId(null);
    setSelectedType(null);
    setSelectedPaymentType(null);
    setDateMode("none");
    setSelectedDate(null);
    setSelectedFromDate(null);
    setSelectedToDate(null);
    setActiveDatePicker(null);
    onClear();
    onClose();
  };

  const OptionButton = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceHighlight,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Typography
        variant="bodySmall"
        weight={selected ? "semibold" : "regular"}
        // `onPrimary` respeta el aviso de contraste sobre `primary`.
        style={selected ? { color: colors.onPrimary } : undefined}
      >
        {label}
      </Typography>
    </Pressable>
  );

  const DateRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: number | null;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.dateRow,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
        },
      ]}
    >
      <Typography variant="caption" muted>
        {label}
      </Typography>
      <Typography variant="body" muted={!value}>
        {value
          ? new Date(value).toLocaleDateString()
          : ((STRINGS.wallet as any).selectDate ?? "Seleccionar fecha")}
      </Typography>
    </TouchableOpacity>
  );

  const RadioRow = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={styles.radioRow}
    >
      <View
        style={[
          styles.radioOuter,
          { borderColor: selected ? colors.primary : colors.border },
        ]}
      >
        {selected && (
          <View
            style={[styles.radioInner, { backgroundColor: colors.primary }]}
          />
        )}
      </View>
      <Typography variant="body">{label}</Typography>
    </Pressable>
  );

  const handleDateChange = (
    target: "single" | "from" | "to",
    _: DateTimePickerEvent,
    selected?: Date,
  ) => {
    const next = selected?.getTime();
    if (target === "single") setSelectedDate(next ?? null);
    if (target === "from") setSelectedFromDate(next ?? null);
    if (target === "to") setSelectedToDate(next ?? null);
    setActiveDatePicker(null);
  };

  const datePickerStyle =
    Platform.OS === "ios"
      ? { backgroundColor: colors.surfaceHighlight }
      : undefined;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filtrar Transacciones"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Type Filter */}
        <View style={styles.section}>
          <Typography variant="overline" muted style={styles.sectionLabel}>
            {STRINGS.wallet.type}
          </Typography>
          <View style={styles.optionsRow}>
            <OptionButton
              label={STRINGS.wallet.income}
              selected={selectedType === "income"}
              onPress={() =>
                setSelectedType(selectedType === "income" ? null : "income")
              }
            />
            <OptionButton
              label={STRINGS.wallet.expense}
              selected={selectedType === "expense"}
              onPress={() =>
                setSelectedType(selectedType === "expense" ? null : "expense")
              }
            />
          </View>
        </View>

        {/* Date Filter */}
        <View style={styles.section}>
          <Typography variant="overline" muted style={styles.sectionLabel}>
            {(STRINGS.wallet as any).dateFilter ?? "Fecha"}
          </Typography>

          <RadioRow
            label={(STRINGS.wallet as any).noDateFilter ?? "Sin filtro"}
            selected={dateMode === "none"}
            onPress={() => {
              setDateMode("none");
              setSelectedDate(null);
              setSelectedFromDate(null);
              setSelectedToDate(null);
              setActiveDatePicker(null);
            }}
          />
          <RadioRow
            label={(STRINGS.wallet as any).singleDate ?? "Fecha específica"}
            selected={dateMode === "single"}
            onPress={() => {
              setDateMode("single");
              setSelectedFromDate(null);
              setSelectedToDate(null);
              setActiveDatePicker(null);
            }}
          />
          {dateMode === "single" && (
            <>
              <DateRow
                label={STRINGS.wallet.date}
                value={selectedDate}
                onPress={() => setActiveDatePicker("single")}
              />
              {activeDatePicker === "single" && (
                <DateTimePicker
                  value={new Date(selectedDate ?? Date.now())}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(e, d) => handleDateChange("single", e, d)}
                  maximumDate={new Date()}
                  style={datePickerStyle}
                />
              )}
            </>
          )}

          <RadioRow
            label={(STRINGS.wallet as any).dateRange ?? "Rango de fechas"}
            selected={dateMode === "range"}
            onPress={() => {
              setDateMode("range");
              setSelectedDate(null);
              setActiveDatePicker(null);
            }}
          />
          {dateMode === "range" && (
            <>
              <DateRow
                label={(STRINGS.wallet as any).from ?? "Desde"}
                value={selectedFromDate}
                onPress={() => setActiveDatePicker("from")}
              />
              {activeDatePicker === "from" && (
                <DateTimePicker
                  value={new Date(selectedFromDate ?? Date.now())}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(e, d) => handleDateChange("from", e, d)}
                  maximumDate={new Date()}
                  style={datePickerStyle}
                />
              )}
              <DateRow
                label={(STRINGS.wallet as any).to ?? "Hasta"}
                value={selectedToDate}
                onPress={() => setActiveDatePicker("to")}
              />
              {activeDatePicker === "to" && (
                <DateTimePicker
                  value={new Date(selectedToDate ?? Date.now())}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(e, d) => handleDateChange("to", e, d)}
                  maximumDate={new Date()}
                  style={datePickerStyle}
                />
              )}
            </>
          )}
        </View>

        {/* Payment Type Filter */}
        <View style={styles.section}>
          <Typography variant="overline" muted style={styles.sectionLabel}>
            Tipo de pago
          </Typography>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() =>
              setIsPaymentTypeDropdownOpen(!isPaymentTypeDropdownOpen)
            }
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.surfaceHighlight,
                borderColor: colors.border,
                marginBottom: isPaymentTypeDropdownOpen ? 0 : Spacing.m,
                borderBottomLeftRadius: isPaymentTypeDropdownOpen
                  ? 0
                  : BorderRadius.m,
                borderBottomRightRadius: isPaymentTypeDropdownOpen
                  ? 0
                  : BorderRadius.m,
              },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Typography variant="body" muted={!selectedPaymentType}>
                {selectedPaymentType
                  ? selectedPaymentType === "credit_card"
                    ? "Tarjeta de crédito"
                    : selectedPaymentType === "debit_card"
                      ? "Tarjeta de débito"
                      : selectedPaymentType === "cash"
                        ? "Efectivo"
                        : selectedPaymentType === "transfer"
                          ? "Transferencia"
                          : "Nómina"
                  : "Seleccionar tipo de pago"}
              </Typography>
              <IconSymbol
                name={isPaymentTypeDropdownOpen ? "chevron.up" : "chevron.down"}
                size={16}
                color={colors.icon}
              />
            </View>
          </TouchableOpacity>

          {isPaymentTypeDropdownOpen && (
            <View
              style={[
                styles.dropdownList,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceHighlight,
                },
              ]}
            >
              <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedPaymentType(null);
                    setIsPaymentTypeDropdownOpen(false);
                  }}
                  style={styles.dropdownItem}
                >
                  <Typography
                    variant="body"
                    weight={selectedPaymentType === null ? "semibold" : "regular"}
                  >
                    Todos
                  </Typography>
                </TouchableOpacity>
                {[
                  { id: "credit_card", label: "Tarjeta de crédito" },
                  { id: "debit_card", label: "Tarjeta de débito" },
                  { id: "cash", label: "Efectivo" },
                  { id: "transfer", label: "Transferencia" },
                  { id: "payroll", label: "Nómina" },
                ].map((pt) => (
                  <TouchableOpacity
                    key={pt.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedPaymentType(pt.id as any);
                      setIsPaymentTypeDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      styles.dropdownItemDivided,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Typography
                      variant="body"
                      weight={
                        selectedPaymentType === pt.id ? "semibold" : "regular"
                      }
                    >
                      {pt.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Entity Filter */}
        {entities.length > 0 && (
          <View style={styles.section}>
            <Typography variant="overline" muted style={styles.sectionLabel}>
              Activo/Pasivo Asociado
            </Typography>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.surfaceHighlight,
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
                <Typography variant="body" muted={!selectedEntityId}>
                  {selectedEntityId
                    ? entities.find((e) => e.id === selectedEntityId)?.name ||
                      "Seleccionar Entidad"
                    : "Seleccionar Entidad"}
                </Typography>
                <IconSymbol
                  name={isEntityDropdownOpen ? "chevron.up" : "chevron.down"}
                  size={16}
                  color={colors.icon}
                />
              </View>
            </TouchableOpacity>

            {isEntityDropdownOpen && (
              <View
                style={[
                  styles.dropdownList,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceHighlight,
                  },
                ]}
              >
                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedEntityId(null);
                      setIsEntityDropdownOpen(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Typography
                      variant="body"
                      weight={selectedEntityId === null ? "semibold" : "regular"}
                    >
                      Todos
                    </Typography>
                  </TouchableOpacity>
                  {entities.map((entity) => (
                    <TouchableOpacity
                      key={entity.id}
                      accessibilityRole="button"
                      onPress={() => {
                        setSelectedEntityId(entity.id);
                        setIsEntityDropdownOpen(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        styles.dropdownItemDivided,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <Typography
                        variant="body"
                        weight={
                          selectedEntityId === entity.id
                            ? "semibold"
                            : "regular"
                        }
                      >
                        {entity.name}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Typography variant="overline" muted style={styles.sectionLabel}>
              {STRINGS.wallet.category}
            </Typography>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/wallet/category-picker",
                  params: {
                    target: "transactionFilter",
                    includeAll: "1",
                    selected: selectedCategory || "",
                  },
                })
              }
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.surfaceHighlight,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.dropdownHeader}>
                <Typography variant="body" style={styles.dropdownValue}>
                  {selectedCategory || "Todas"}
                </Typography>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.icon}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Limpiar"
          onPress={handleClear}
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title="Aplicar"
          onPress={handleApply}
          style={styles.footerButton}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.l,
  },
  sectionLabel: {
    marginBottom: Spacing.s,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  optionButton: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dropdown: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  dropdownValue: {
    flex: 1,
  },
  dropdownList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.m,
    borderBottomRightRadius: BorderRadius.m,
    marginBottom: Spacing.m,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.sm,
  },
  dropdownItemDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.s,
    marginTop: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.s,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.round,
  },
  dateRow: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.s,
  },
});
