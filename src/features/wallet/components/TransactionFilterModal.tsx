import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Category } from "@/features/wallet/data/categoriesSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
  TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

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

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

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
      setIsCategoryDropdownOpen(false);
      setIsEntityDropdownOpen(false);
      setIsPaymentTypeDropdownOpen(false);
      setCategorySearchQuery("");
    }
  }, [visible, currentFilters]);

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
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceHighlight,
          borderColor: selected ? colors.primary : "transparent",
        },
      ]}
    >
      <Typography
        variant="caption"
        weight={selected ? "bold" : "regular"}
        style={{ color: selected ? "#fff" : colors.text }}
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
      style={[
        styles.dateRow,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
        },
      ]}
    >
      <Typography variant="caption" style={{ color: colors.textSecondary }}>
        {label}
      </Typography>
      <Typography variant="body" style={{ color: colors.text }}>
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
    <Pressable onPress={onPress} style={styles.radioRow}>
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
      <Typography variant="body" style={{ color: colors.text }}>
        {label}
      </Typography>
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.text }}
            >
              Filtrar Transacciones
            </Typography>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 500 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Type Filter */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="bold"
                style={{ marginBottom: Spacing.s, color: colors.text }}
              >
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
                    setSelectedType(
                      selectedType === "expense" ? null : "expense",
                    )
                  }
                />
              </View>
            </View>

            {/* Date Filter */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="bold"
                style={{ marginBottom: Spacing.s, color: colors.text }}
              >
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
                      style={
                        Platform.OS === "ios"
                          ? { backgroundColor: colors.surfaceHighlight }
                          : undefined
                      }
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
                      style={
                        Platform.OS === "ios"
                          ? { backgroundColor: colors.surfaceHighlight }
                          : undefined
                      }
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
                      style={
                        Platform.OS === "ios"
                          ? { backgroundColor: colors.surfaceHighlight }
                          : undefined
                      }
                    />
                  )}
                </>
              )}
            </View>

            {/* Payment Type Filter */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="bold"
                style={{ marginBottom: Spacing.s, color: colors.text }}
              >
                Tipo de pago
              </Typography>
              <TouchableOpacity
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
                  <Typography
                    variant="body"
                    style={{
                      color: selectedPaymentType
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
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
                  <Typography variant="body" style={{ color: colors.text }}>
                    {isPaymentTypeDropdownOpen ? "▲" : "▼"}
                  </Typography>
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
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPaymentType(null);
                        setIsPaymentTypeDropdownOpen(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <Typography variant="body" style={{ color: colors.text }}>
                        Todos
                      </Typography>
                    </TouchableOpacity>
                    {[
                      { id: "credit_card", label: "Tarjeta de crédito" },
                      { id: "debit_card", label: "Tarjeta de débito" },
                      { id: "cash", label: "Efectivo" },
                      { id: "transfer", label: "Transferencia" },
                      { id: "payroll", label: "Nómina" },
                    ].map((pt, index) => (
                      <TouchableOpacity
                        key={pt.id}
                        onPress={() => {
                          setSelectedPaymentType(pt.id as any);
                          setIsPaymentTypeDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          {
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                          },
                        ]}
                      >
                        <Typography
                          variant="body"
                          weight={
                            selectedPaymentType === pt.id ? "bold" : "regular"
                          }
                          style={{ color: colors.text }}
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
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ marginBottom: Spacing.s, color: colors.text }}
                >
                  Activo/Pasivo Asociado
                </Typography>
                <TouchableOpacity
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
                    <Typography
                      variant="body"
                      style={{
                        color: selectedEntityId
                          ? colors.text
                          : colors.textSecondary,
                      }}
                    >
                      {selectedEntityId
                        ? entities.find((e) => e.id === selectedEntityId)
                            ?.name || "Seleccionar Entidad"
                        : "Seleccionar Entidad"}
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
                        backgroundColor: colors.surfaceHighlight,
                      },
                    ]}
                  >
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedEntityId(null);
                          setIsEntityDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Typography
                          variant="body"
                          style={{ color: colors.text }}
                        >
                          Todos
                        </Typography>
                      </TouchableOpacity>
                      {entities.map((entity, index) => (
                        <TouchableOpacity
                          key={entity.id}
                          onPress={() => {
                            setSelectedEntityId(entity.id);
                            setIsEntityDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            {
                              borderTopWidth: 1,
                              borderTopColor: colors.border,
                            },
                          ]}
                        >
                          <Typography
                            variant="body"
                            weight={
                              selectedEntityId === entity.id
                                ? "bold"
                                : "regular"
                            }
                            style={{ color: colors.text }}
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
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ marginBottom: Spacing.s, color: colors.text }}
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
                      backgroundColor: colors.surfaceHighlight,
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
                          : colors.textSecondary,
                        flex: 1,
                      }}
                    >
                      {selectedCategory || "Seleccionar Categoría"}
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
                        backgroundColor: colors.surfaceHighlight,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.searchContainer,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <TextInput
                        value={categorySearchQuery}
                        onChangeText={setCategorySearchQuery}
                        placeholder={STRINGS.common.search}
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="while-editing"
                      />
                    </View>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCategory(null);
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Typography
                          variant="body"
                          style={{ color: colors.text }}
                        >
                          Todas
                        </Typography>
                      </TouchableOpacity>
                      {categories
                        .filter((cat) => {
                          if (!categorySearchQuery.trim()) return true;
                          const q = categorySearchQuery.trim().toLowerCase();
                          return cat.name.toLowerCase().includes(q);
                        })
                        .map((cat, index) => (
                        <TouchableOpacity
                          key={cat.id || cat.name}
                          onPress={() => {
                            setSelectedCategory(cat.name);
                            setIsCategoryDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            {
                              borderTopWidth: 1,
                              borderTopColor: colors.border,
                            },
                          ]}
                        >
                          <Typography
                            variant="body"
                            weight={
                              selectedCategory === cat.name ? "bold" : "regular"
                            }
                            style={{ color: colors.text }}
                          >
                            {cat.name}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Limpiar"
              onPress={handleClear}
              variant="outline"
              style={{ flex: 1, marginRight: Spacing.s }}
            />
            <Button title="Aplicar" onPress={handleApply} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.m,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  section: {
    marginBottom: Spacing.l,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  optionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
    borderWidth: 1,
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
  },
  dropdownItem: {
    padding: Spacing.m,
  },
  footer: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
  searchContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
  },
  searchInput: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.m,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: Spacing.s,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dateRow: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    marginBottom: Spacing.s,
  },
});
