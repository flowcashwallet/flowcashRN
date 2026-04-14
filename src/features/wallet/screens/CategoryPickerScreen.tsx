import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import { RootState } from "@/store/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../data/categoriesSlice";
import {
  CategoryPickerTarget,
  setCategoryPickerSelection,
} from "../data/walletUiSlice";

type CategoryPickerItem =
  | { id: "__all__"; type: "all" }
  | { id: "__manage__"; type: "manage" }
  | { id: string; type: "category"; name: string };

export default function CategoryPickerScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const target = (params.target as CategoryPickerTarget) || "transactionForm";
  const includeAll = params.includeAll === "1";
  const selectedParam = params.selected as string | undefined;
  const selected = selectedParam ? selectedParam : null;

  const [query, setQuery] = useState("");

  const { user } = useSelector((state: RootState) => state.auth);
  const categories = useSelector(
    (state: RootState) => state.categories.categories,
  );

  useEffect(() => {
    if (user?.id && categories.length === 0) {
      dispatch(fetchCategories(user.id.toString()) as any);
    }
  }, [categories.length, dispatch, user?.id]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const items = useMemo<CategoryPickerItem[]>(() => {
    const next: CategoryPickerItem[] = [];
    if (includeAll) next.push({ id: "__all__", type: "all" });
    next.push(
      ...filteredCategories.map((c) => ({
        id: c.id,
        type: "category" as const,
        name: c.name,
      })),
    );
    next.push({ id: "__manage__", type: "manage" });
    return next;
  }, [filteredCategories, includeAll]);

  const handleSelect = (value: string | null) => {
    dispatch(setCategoryPickerSelection({ target, value }) as any);
    router.back();
  };

  const handleManage = () => {
    router.push("/wallet/categories");
  };

  return (
    <View>
      <View style={{ flex: 1 }}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          stickyHeaderIndices={[0]}
          keyboardShouldPersistTaps="handled"
          style={{
            paddingHorizontal: Spacing.m,
            backgroundColor: colors.surface,
          }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: colors.border }} />
          )}
          ListHeaderComponent={
            <View
              style={{
                paddingBottom: Spacing.m,
                paddingHorizontal: Spacing.m,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={STRINGS.common.search}
                placeholderTextColor={colors.textSecondary}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
                style={{
                  backgroundColor: colors.surfaceHighlight,
                  borderRadius: BorderRadius.m,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: Spacing.s,
                  paddingHorizontal: Spacing.m,
                  color: colors.text,
                }}
              />
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === "all") {
              return (
                <TouchableOpacity
                  onPress={() => handleSelect(null)}
                  style={{
                    paddingHorizontal: Spacing.m,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body" style={{ color: colors.text }}>
                    Todas
                  </Typography>
                  {!selected && (
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }

            if (item.type === "manage") {
              return (
                <TouchableOpacity
                  onPress={handleManage}
                  style={{
                    paddingHorizontal: Spacing.m,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <IconSymbol name="plus" size={16} color={colors.primary} />
                  <Typography
                    variant="body"
                    style={{ color: colors.primary, marginLeft: Spacing.s }}
                  >
                    Administrar Categorías
                  </Typography>
                </TouchableOpacity>
              );
            }

            const isSelected = selected === item.name;
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item.name)}
                style={{
                  paddingHorizontal: Spacing.m,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isSelected
                    ? colors.surfaceHighlight
                    : colors.surface,
                }}
              >
                <Typography
                  variant="body"
                  style={{
                    color: isSelected ? colors.primary : colors.text,
                    flex: 1,
                  }}
                >
                  {item.name}
                </Typography>
                {isSelected && (
                  <IconSymbol
                    name="checkmark"
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          }}
          contentInsetAdjustmentBehavior="automatic"
        />
      </View>
    </View>
  );
}
