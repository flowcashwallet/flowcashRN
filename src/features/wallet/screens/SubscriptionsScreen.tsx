import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useVisionData } from "@/features/vision/hooks/useVisionData";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppDispatch, RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
    EntitySelectionList,
    EntitySelectionModal,
} from "../components/EntitySelectionModal";
import {
    Subscription,
    addSubscription,
    deleteSubscription,
    fetchSubscriptions,
    processDueSubscriptions,
    updateSubscription,
} from "../data/subscriptionSlice";
import { fetchTransactions } from "../data/walletSlice";

export default function SubscriptionsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { subscriptions, loading } = useSelector(
    (state: RootState) => state.subscriptions,
  );
  const { entities: visionEntities } = useVisionData();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">(
    "monthly",
  );
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isEntityModalVisible, setIsEntityModalVisible] = useState(false);

  const resetForm = () => {
    setName("");
    setAmount("");
    setCategory("General");
    setFrequency("monthly");
    setNextPaymentDate(new Date());
    setSelectedEntityId(null);
  };

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchSubscriptions(user.id.toString()));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (subscriptions.length > 0) {
      dispatch(processDueSubscriptions());
    }
  }, [subscriptions, dispatch]);

  const handleEdit = (sub: Subscription) => {
    setEditingSubscription(sub);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setCategory(sub.category);
    setFrequency(sub.frequency);
    setNextPaymentDate(new Date(sub.nextPaymentDate));
    setSelectedEntityId(sub.relatedEntityId || null);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingSubscription(null);
    setName("");
    setAmount("");
    setFrequency("monthly");
    setNextPaymentDate(new Date());
    setSelectedEntityId(null);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!user?.id || !name || !amount) return;

    const subscriptionData = {
      userId: user.id.toString(),
      name,
      amount: parseFloat(amount),
      category: "General", // TODO: Add category selector
      frequency,
      nextPaymentDate: nextPaymentDate.getTime(),
      relatedEntityId: selectedEntityId || undefined,
      reminderEnabled: true,
    };

    if (editingSubscription) {
      await dispatch(
        updateSubscription({
          ...subscriptionData,
          id: editingSubscription.id,
        }),
      );
    } else {
      await dispatch(addSubscription(subscriptionData));
    }

    // Process due subscriptions immediately to create transactions if needed
    const result = await dispatch(processDueSubscriptions());
    if (processDueSubscriptions.fulfilled.match(result)) {
      const count = result.payload as number;
      if (count > 0) {
        Alert.alert("Éxito", "Suscripción guardada y transacción generada.");
        // Refresh transactions to ensure wallet is up to date
        dispatch(fetchTransactions());
      } else {
        Alert.alert("Éxito", "Suscripción guardada.");
      }
    }

    setIsModalVisible(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteSubscription(id));
    setIsModalVisible(false);
  };

  const renderItem = ({ item }: { item: Subscription }) => (
    <TouchableOpacity onPress={() => handleEdit(item)}>
      <Card
        style={{
          marginBottom: Spacing.m,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: "center",
            alignItems: "center",
            marginRight: Spacing.m,
          }}
        >
          <IconSymbol
            name="arrow.right.arrow.left"
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="body" weight="bold">
            {item.name}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            {new Date(item.nextPaymentDate).toLocaleDateString()} •{" "}
            {item.frequency}
          </Typography>
        </View>
        <Typography variant="h3" weight="bold" style={{ color: colors.text }}>
          {formatCurrency(item.amount)}
        </Typography>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold">
          Suscripciones
        </Typography>
        <TouchableOpacity onPress={handleAdd} style={styles.headerButton}>
          <IconSymbol
            name="plus.circle.fill"
            size={32}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {loading && subscriptions.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={subscriptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.m }}
          ListEmptyComponent={
            <Typography
              style={{
                textAlign: "center",
                marginTop: Spacing.xl,
                color: colors.textSecondary,
              }}
            >
              No tienes suscripciones activas.
            </Typography>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (isEntityModalVisible) {
            setIsEntityModalVisible(false);
          } else {
            setIsModalVisible(false);
            setEditingSubscription(null);
            resetForm();
          }
        }}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {isEntityModalVisible ? (
            <EntitySelectionList
              onClose={() => setIsEntityModalVisible(false)}
              onSelect={(entityId) => {
                setSelectedEntityId(entityId);
                setIsEntityModalVisible(false);
              }}
              visionEntities={visionEntities || []}
              selectedEntityId={selectedEntityId}
            />
          ) : (
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Typography variant="h3" weight="bold">
                  {editingSubscription
                    ? "Editar Suscripción"
                    : "Nueva Suscripción"}
                </Typography>
                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(false);
                    setEditingSubscription(null);
                    resetForm();
                  }}
                >
                  <Typography variant="body" style={{ color: colors.primary }}>
                    Cancelar
                  </Typography>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={{ padding: Spacing.m }}
                keyboardShouldPersistTaps="handled"
              >
                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.s }}
                >
                  Nombre del servicio
                </Typography>
                <Input
                  placeholder="Netflix, Spotify, Renta..."
                  value={name}
                  onChangeText={setName}
                />

                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.s }}
                >
                  Monto
                </Typography>
                <Input
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.s }}
                >
                  Frecuencia
                </Typography>
                <View
                  style={{
                    flexDirection: "row",
                    gap: Spacing.s,
                    marginBottom: Spacing.m,
                  }}
                >
                  {(["weekly", "monthly", "yearly"] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setFrequency(freq)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            frequency === freq ? colors.primary : "transparent",
                          borderColor:
                            frequency === freq ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Typography
                        style={{
                          color: frequency === freq ? "#FFF" : colors.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {freq === "weekly"
                          ? "Semanal"
                          : freq === "monthly"
                            ? "Mensual"
                            : "Anual"}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>

                <Typography
                  variant="caption"
                  style={{
                    marginBottom: Spacing.s,
                    color: colors.textSecondary,
                  }}
                >
                  Cuenta de Pago ({visionEntities?.length || 0} disponibles)
                </Typography>
                <TouchableOpacity
                  onPress={() => {
                    setIsEntityModalVisible(true);
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    height: 50,
                    borderWidth: 1,
                    borderRadius: BorderRadius.m,
                    paddingHorizontal: Spacing.m,
                    marginBottom: Spacing.m,
                  }}
                >
                  <Typography
                    style={{
                      color: selectedEntityId
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedEntityId
                      ? visionEntities.find((e) => e.id === selectedEntityId)
                          ?.name
                      : "Seleccionar cuenta"}
                  </Typography>
                  <IconSymbol
                    name="chevron.down"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <Typography
                  variant="caption"
                  style={{
                    marginBottom: Spacing.s,
                    color: colors.textSecondary,
                  }}
                >
                  Próximo Pago
                </Typography>
                <DateTimePicker
                  value={nextPaymentDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => date && setNextPaymentDate(date)}
                  style={{ alignSelf: "flex-start", marginBottom: Spacing.l }}
                />

                <Button
                  title="Guardar"
                  onPress={handleSave}
                  variant="primary"
                  style={{ marginTop: Spacing.m }}
                />

                {editingSubscription && (
                  <Button
                    title="Eliminar"
                    onPress={() => handleDelete(editingSubscription.id)}
                    variant="ghost"
                    style={{ marginTop: Spacing.s }}
                    textStyle={{ color: colors.error }}
                  />
                )}
              </ScrollView>
            </SafeAreaView>
          )}
        </View>
      </Modal>

      <EntitySelectionModal
        visible={isEntityModalVisible}
        onClose={() => setIsEntityModalVisible(false)}
        onSelect={(entityId) => {
          setSelectedEntityId(entityId);
          setIsEntityModalVisible(false);
        }}
        visionEntities={visionEntities || []}
        selectedEntityId={selectedEntityId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: Spacing.m,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
  },
  chip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.l,
    borderWidth: 1,
  },
});
