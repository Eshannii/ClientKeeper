import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Colors from "../../../constants/Colors";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../config/FirebaseConfig";
import { getLocalStorage } from "../../../service/Storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const ClientFilingHistory = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [client, setClient] = useState(null);
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [periodInput, setPeriodInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCnic, setEditCnic] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFees, setEditFees] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const clientSnap = await getDoc(doc(db, "clients", id));
      if (clientSnap.exists()) {
        setClient({ id: clientSnap.id, ...clientSnap.data() });
      }

      const filingsQ = query(
        collection(db, "clients", id, "filings"),
        orderBy("period", "desc"),
      );
      const filingsSnap = await getDocs(filingsQ);
      const results = [];
      filingsSnap.forEach((d) => results.push({ id: d.id, ...d.data() }));
      setFilings(results);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not load client filing history");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const isFreeClient = String(client?.fees).trim().toLowerCase() === "free";

  const openAddModal = () => {
    // Income Tax ke liye placeholder e.g. "2024-25", Sales Tax ke liye "2026-03"
    setPeriodInput("");
    setNoteInput("");
    setModalVisible(true);
  };

  const saveManualFiling = async () => {
    if (!periodInput.trim()) {
      Alert.alert("Please enter a period, e.g. 2024-25 or 2026-03");
      return;
    }

    setSaving(true);
    try {
      const user = await getLocalStorage("userDetail");
      await setDoc(doc(db, "clients", id, "filings", periodInput.trim()), {
        period: periodInput.trim(),
        type: client?.type?.name || null,
        filedAt: new Date().toISOString(),
        filedBy: user?.email || null,
        note: noteInput.trim() || null,
        addedManually: true,
      });
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not save filing record");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !client) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.DARK_BLUE} />
      </View>
    );
  }
  const openEditModal = () => {
    setEditName(client?.name || "");
    setEditCnic(client?.cnic || "");
    setEditPhone(client?.phone || "");
    setEditFees(client?.fees || "");
    setEditPassword(client?.password || "");
    setEditModalVisible(true);
  };

  const saveClientEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Please enter client name");
      return;
    }
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "clients", id), {
        name: editName.trim(),
        cnic: editCnic.trim(),
        phone: editPhone.trim(),
        fees: editFees.trim(),
        password: editPassword.trim(),
      });
      setClient((prev) => ({
        ...prev,
        name: editName.trim(),
        cnic: editCnic.trim(),
        phone: editPhone.trim(),
        fees: editFees.trim(),
        password: editPassword.trim(),
      }));
      setEditModalVisible(false);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not update client details");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteFiling = (filing) => {
    Alert.alert(
      "Delete Filing",
      `Kya aap period "${filing.period}" ki filing delete karna chahte hain?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "clients", id, "filings", filing.id));
              setFilings((prev) => prev.filter((f) => f.id !== filing.id));
            } catch (e) {
              console.log(e);
              Alert.alert("Error", "Could not delete filing record");
            }
          },
        },
      ],
    );
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Filing History</Text>
        <View style={{ flexDirection: "row", gap: 15 }}>
          <TouchableOpacity onPress={openEditModal}>
            <MaterialIcons name="edit" size={24} color={Colors.DARK_BLUE} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openAddModal}>
            <MaterialIcons
              name="add-circle"
              size={26}
              color={Colors.DARK_BLUE}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {/* Client info card */}
        <View style={styles.infoCard}>
          <Text style={styles.clientName}>{client?.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CNIC</Text>
            <Text style={styles.infoValue}>{client?.cnic}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{client?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{client?.type?.name}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fee</Text>
            <Text
              style={[styles.infoValue, isFreeClient && { color: "green" }]}
            >
              {isFreeClient ? "Free" : `Rs. ${client?.fees}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Password</Text>
            <Text style={styles.infoValue}>{client?.password}</Text>
          </View>
        </View>

        {/* Filing history */}
        <Text style={styles.sectionTitle}>Filing History</Text>

        {filings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={40} color="gray" />
            <Text style={styles.emptyText}>
              Abhi tak koi filing record nahi. "+" dabakar add karo.
            </Text>
          </View>
        ) : (
          filings.map((f) => (
            <View key={f.id} style={styles.filingCard}>
              <View style={styles.filingIconWrap}>
                <MaterialIcons name="check-circle" size={22} color="green" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filingPeriod}>{f.period}</Text>
                {f.filedAt && (
                  <Text style={styles.filingDate}>
                    Filed on {new Date(f.filedAt).toLocaleDateString()}
                  </Text>
                )}
                {f.note ? (
                  <Text style={styles.filingNote}>{f.note}</Text>
                ) : null}
              </View>
              {f.addedManually && (
                <View style={styles.manualBadge}>
                  <Text style={styles.manualBadgeText}>Manual</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleDeleteFiling(f)}
                style={{ marginLeft: 10 }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={22}
                  color="#E74C3C"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add manual filing modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Previous Filing</Text>

            <Text style={styles.modalLabel}>
              Period (
              {client?.type?.name === "Sales Tax"
                ? "e.g. 2026-03"
                : "e.g. 2024-25"}
              )
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Period"
              value={periodInput}
              onChangeText={setPeriodInput}
            />

            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Note"
              value={noteInput}
              onChangeText={setNoteInput}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#eee" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "black" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: Colors.DARK_BLUE },
                ]}
                onPress={saveManualFiling}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: "white" }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit client modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Client Details</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.modalLabel}>CNIC</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="CNIC"
              value={editCnic}
              onChangeText={setEditCnic}
            />

            <Text style={styles.modalLabel}>Phone</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.modalLabel}>Fee (Rs. ya "Free" likhein)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Fee"
              value={editFees}
              onChangeText={setEditFees}
            />

            <Text style={styles.modalLabel}>Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              value={editPassword}
              onChangeText={setEditPassword}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#eee" }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: "black" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: Colors.DARK_BLUE },
                ]}
                onPress={saveClientEdit}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: "white" }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    marginTop: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "gray",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
  },
  typeBadge: {
    backgroundColor: Colors.DARK_BLUE + "20",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.DARK_BLUE,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 8,
    color: "gray",
    fontSize: 14,
  },
  filingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  filingIconWrap: {
    marginRight: 10,
  },
  filingPeriod: {
    fontSize: 15,
    fontWeight: "bold",
    color: "black",
  },
  filingDate: {
    fontSize: 12,
    color: "gray",
    marginTop: 2,
  },
  filingNote: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    fontStyle: "italic",
  },
  manualBadge: {
    backgroundColor: "#f0ad4e20",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  manualBadgeText: {
    fontSize: 10,
    color: "#f0ad4e",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 15,
    color: "black",
  },
  modalLabel: {
    fontSize: 13,
    color: "gray",
    marginBottom: 5,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
});

export default ClientFilingHistory;
