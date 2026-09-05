import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Foundation from "@expo/vector-icons/Foundation";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import Colors from "../../../constants/Colors";
import { useRouter } from "expo-router";
import CaseLawEmpty from "../../../components/CaseLawEmpty";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  FormatDate,
  formatDateForText,
} from "../../../service/ConvertDateTime";

import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../config/FirebaseConfig";

export default function Profile() {
  const router = useRouter();

  // =========================
  // CASE LAW STATES
  // =========================

  const [caselaws, setCaselaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // =========================
  // EDIT MODAL STATES
  // =========================

  const [selectedCaselaw, setSelectedCaselaw] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editCaseNo, setEditCaseNo] = useState("");
  const [editCaseTitle, setEditCaseTitle] = useState("");
  const [editJudgeName, setEditJudgeName] = useState("");
  const [editCourtName, setEditCourtName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editJudgementDate, setEditJudgementDate] = useState("");
  const [editReportedAs, setEditReportedAs] = useState("");
  const [editJudgementDetails, setEditJudgementDetails] = useState("");

  const [editSaving, setEditSaving] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // =========================
  // DETAILS MODAL STATES
  // =========================

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // =========================
  // FETCH CASE LAWS
  // =========================

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeSnapshot();

      if (!user) {
        setCaselaws([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "caselaws"),
        where("userEmail", "==", user.email),
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          data.sort((a, b) => Number(b.docId) - Number(a.docId));

          setCaselaws(data);
          setLoading(false);
        },
        (error) => {
          console.log("Caselaw fetch error:", error);
          setLoading(false);

          Alert.alert("Error", "Could not load case notes");
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  // =========================
  // SEARCH
  // =========================

  const filteredCaselaws = caselaws.filter((item) => {
    const search = searchText.trim().toLowerCase();

    if (!search) return true;

    return (
      item.caseTitle?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.caseNo?.toLowerCase().includes(search)
    );
  });

  // =========================
  // DELETE CASE LAW
  // =========================

  const onDeleteCaselaw = (item) => {
    Alert.alert(
      "Delete Case Note",
      `Are you sure you want to delete "${item.caseTitle}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              await deleteDoc(doc(db, "caselaws", item.id));

              Alert.alert("Success", "Case note deleted successfully");
            } catch (e) {
              console.log("Delete error:", e);

              Alert.alert("Error", "Could not delete case note");
            }
          },
        },
      ],
    );
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  // Firestore Timestamp ho ya plain string, dono ko safe string mein convert karta hai
  const toDateString = (value) => {
    if (!value) return "";
    if (typeof value === "object" && value?.seconds !== undefined) {
      return new Date(value.seconds * 1000).toISOString().split("T")[0];
    }
    if (typeof value === "string") return value;
    return String(value);
  };

  const onEditCaselaw = (item) => {
    if (!item?.id) {
      Alert.alert("Error", "Case note not found");
      return;
    }

    setSelectedCaselaw(item);

    setEditCaseNo(item?.caseNo || "");
    setEditCaseTitle(item?.caseTitle || "");
    setEditJudgeName(item?.judgeName || "");
    setEditCourtName(item?.courtName || "");
    setEditCategory(item?.category || "");
    setEditJudgementDate(toDateString(item?.judgementDate));
    setEditReportedAs(item?.reportedAs || "");
    setEditJudgementDetails(item?.judgementDetails || "");

    setEditModalVisible(true);
  };

  const onEditJudgementDateChange = (event, selectedDate) => {
    setShowEditDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setEditJudgementDate(FormatDate(selectedDate));
    }
  };

  // SAVE EDIT
  const saveCaselawEdit = async () => {
    if (
      !editCaseNo.trim() ||
      !editCaseTitle.trim() ||
      !editJudgeName.trim() ||
      !editCourtName.trim() ||
      !editCategory.trim() ||
      !String(editJudgementDate || "").trim()
    ) {
      Alert.alert("Please fill all required fields");
      return;
    }

    if (!selectedCaselaw?.id) {
      Alert.alert("Error", "Case note not found");
      return;
    }

    setEditSaving(true);

    try {
      const updatedData = {
        caseNo: editCaseNo.trim(),
        caseTitle: editCaseTitle.trim(),
        judgeName: editJudgeName.trim(),
        courtName: editCourtName.trim(),
        category: editCategory.trim(),
        judgementDate: String(editJudgementDate || "").trim(),
        reportedAs: editReportedAs.trim(),
        judgementDetails: editJudgementDetails.trim(),
      };

      console.log("Updating case:", selectedCaselaw.id);

      console.log("Updated data:", updatedData);

      await updateDoc(doc(db, "caselaws", selectedCaselaw.id), updatedData);

      setCaselaws((prev) =>
        prev.map((item) =>
          item.id === selectedCaselaw.id
            ? {
                ...item,
                ...updatedData,
              }
            : item,
        ),
      );

      setEditModalVisible(false);
      setSelectedCaselaw(null);

      Alert.alert("Success", "Case note updated successfully");
    } catch (error) {
      console.log("CASE UPDATE ERROR:", error);

      Alert.alert("Error", error?.message || "Could not update case note");
    } finally {
      setEditSaving(false);
    }
  };

  // =========================
  // OPEN DETAILS MODAL
  // =========================

  const onViewCaselaw = (item) => {
    setSelectedCaselaw(item);
    setDetailsModalVisible(true);
  };

  // =========================
  // CLOSE DETAILS MODAL
  // =========================

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedCaselaw(null);
  };

  // =========================
  // CLOSE EDIT MODAL
  // =========================

  const closeEditModal = () => {
    if (editSaving) return;

    setEditModalVisible(false);
    setSelectedCaselaw(null);
  };

  // =========================
  // FORMAT LABEL
  // =========================

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  // =========================
  // RENDER CASE CARD
  // =========================

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* LEFT SIDE */}
      <View style={styles.cardLeft}>
        <Text style={styles.caseTitle} numberOfLines={1}>
          {item.caseTitle || "Untitled Case"}
        </Text>

        <Text style={styles.caseNo}>Case No: {item.caseNo || "N/A"}</Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category || "Uncategorized"}
          </Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionContainer}>
        {/* VIEW */}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewCaselaw(item)}
        >
          <MaterialIcons name="visibility" size={19} color="white" />
        </TouchableOpacity>

        {/* EDIT */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEditCaselaw(item)}
        >
          <Feather name="edit-2" size={18} color="white" />
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteCaselaw(item)}
        >
          <AntDesign name="delete" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* =========================
          HEADER
      ========================= */}

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Foundation name="clipboard-notes" size={30} color={Colors.SAGE} />

          <Text style={styles.headerText}>Case Notes</Text>
        </View>

        {/* ADD BUTTON */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-new-caselaw")}
        >
          <MaterialIcons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* =========================
          SEARCH
      ========================= */}

      <View style={styles.searchContainer}>
        <Feather name="search" size={23} color="black" />

        <TextInput
          style={styles.searchInput}
          placeholder="Search case notes..."
          placeholderTextColor={Colors.GRAY}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* =========================
          LIST
      ========================= */}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.SAGE}
          style={{ marginTop: 40 }}
        />
      ) : filteredCaselaws.length === 0 ? (
        <CaseLawEmpty />
      ) : (
        <FlatList
          data={filteredCaselaws}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 5,
            paddingBottom: 40,
          }}
        />
      )}

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.modalTitle}>Edit Case Note</Text>

              <TouchableOpacity onPress={closeEditModal}>
                <AntDesign name="close" size={22} color="black" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* CASE NO */}

              <Text style={styles.inputLabel}>Case No.</Text>

              <TextInput
                style={styles.editInput}
                placeholder="Case No."
                value={editCaseNo}
                onChangeText={setEditCaseNo}
              />

              {/* CASE TITLE */}

              <Text style={styles.inputLabel}>Case Title</Text>

              <TextInput
                style={styles.editInput}
                placeholder="Case Title"
                value={editCaseTitle}
                onChangeText={setEditCaseTitle}
              />

              {/* JUDGE NAME */}

              <Text style={styles.inputLabel}>Judge Name</Text>

              <TextInput
                style={styles.editInput}
                placeholder="Judge Name"
                value={editJudgeName}
                onChangeText={setEditJudgeName}
              />

              {/* COURT NAME */}

              <Text style={styles.inputLabel}>Court Name</Text>

              <TextInput
                style={styles.editInput}
                placeholder="Court Name"
                value={editCourtName}
                onChangeText={setEditCourtName}
              />

              {/* CATEGORY */}

              <Text style={styles.inputLabel}>Case Category</Text>

              <TextInput
                style={styles.editInput}
                placeholder="Tax, Corporate, Criminal..."
                value={editCategory}
                onChangeText={setEditCategory}
              />

              {/* JUDGEMENT DATE */}

              <Text style={styles.inputLabel}>Date Of Judgement</Text>

              <TouchableOpacity
                style={styles.editInput}
                onPress={() => setShowEditDatePicker(true)}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: editJudgementDate ? "black" : "gray",
                  }}
                >
                  {editJudgementDate
                    ? formatDateForText(editJudgementDate)
                    : "Select Date Of Judgement"}
                </Text>
              </TouchableOpacity>

              {showEditDatePicker && (
                <DateTimePicker
                  value={
                    editJudgementDate ? new Date(editJudgementDate) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={onEditJudgementDateChange}
                />
              )}

              {/* REPORTED AS */}

              <Text style={styles.inputLabel}>Reported As</Text>

              <TextInput
                style={styles.editInput}
                placeholder="e.g. PLC 13"
                value={editReportedAs}
                onChangeText={setEditReportedAs}
              />

              {/* JUDGEMENT DETAILS */}

              <Text style={styles.inputLabel}>Judgement Notes</Text>

              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                placeholder="Judgement Notes..."
                value={editJudgementDetails}
                onChangeText={setEditJudgementDetails}
                multiline
                textAlignVertical="top"
              />

              {/* BUTTONS */}

              <View style={styles.editButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeEditModal}
                  disabled={editSaving}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveCaselawEdit}
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsModalContainer}>
            {/* MODAL HEADER */}

            <View style={styles.detailsHeaderRow}>
              <Text style={styles.detailsModalTitle}>Case Details</Text>

              <TouchableOpacity
                onPress={closeDetailsModal}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {selectedCaselaw && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 20,
                }}
              >
                {/* CASE TITLE */}

                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Case Title</Text>

                  <Text style={styles.detailValue}>
                    {selectedCaselaw.caseTitle || "N/A"}
                  </Text>
                </View>

                {/* CASE NUMBER */}

                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Case Number</Text>

                  <Text style={styles.detailValue}>
                    {selectedCaselaw.caseNo || "N/A"}
                  </Text>
                </View>

                {/* CATEGORY */}

                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Category</Text>

                  <Text style={styles.detailValue}>
                    {selectedCaselaw.category || "Uncategorized"}
                  </Text>
                </View>

                {/* OTHER FIELDS */}

                {Object.entries(selectedCaselaw).map(([key, value]) => {
                  // Don't show these
                  if (
                    [
                      "id",
                      "caseTitle",
                      "caseNo",
                      "category",
                      "userEmail",
                      "docId",
                    ].includes(key)
                  ) {
                    return null;
                  }

                  // Don't directly show objects/arrays
                  if (typeof value === "object" && value !== null) {
                    return null;
                  }

                  return (
                    <View key={key} style={styles.detailBox}>
                      <Text style={styles.detailLabel}>{formatLabel(key)}</Text>

                      <Text style={styles.detailValue}>
                        {String(value || "N/A")}
                      </Text>
                    </View>
                  );
                })}

                {/* EDIT BUTTON */}

                <TouchableOpacity
                  style={styles.modalEditButton}
                  onPress={() => {
                    // Modal ko sirf hide karo, selectedCaselaw ko null mat karo
                    // taake onEditCaselaw ko sahi item mile
                    setDetailsModalVisible(false);

                    setTimeout(() => {
                      onEditCaselaw(selectedCaselaw);
                    }, 200);
                  }}
                >
                  <Feather name="edit-2" size={19} color="white" />

                  <Text style={styles.modalEditText}>Edit Case Note</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  // =========================
  // MAIN
  // =========================

  container: {
    flex: 1,
  },

  // =========================
  // HEADER
  // =========================

  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },

  headerText: {
    fontSize: 25,
    fontWeight: "bold",
  },

  addButton: {
    backgroundColor: Colors.SAGE,
    borderRadius: 50,
    padding: 8,
  },

  // =========================
  // SEARCH
  // =========================

  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
    alignItems: "center",
  },

  searchInput: {
    height: 45,
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.SAGE,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "black",
    backgroundColor: "white",
  },

  // =========================
  // CARD
  // =========================

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 15,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#eee",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,

    elevation: 1,
  },

  cardLeft: {
    flex: 1,
    paddingRight: 10,
  },

  caseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },

  caseNo: {
    fontSize: 13,
    color: "gray",
    marginTop: 4,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.SAGE + "20",
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
    marginTop: 6,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.SAGE,
  },

  // =========================
  // ACTION BUTTONS
  // =========================

  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  viewButton: {
    backgroundColor: Colors.SAGE,
    padding: 9,
    borderRadius: 50,
  },

  editButton: {
    backgroundColor: "#4A90E2",
    padding: 9,
    borderRadius: 50,
  },

  deleteButton: {
    backgroundColor: "#E74C3C",
    padding: 9,
    borderRadius: 50,
  },

  // =====================================================
  // EDIT MODAL
  // =====================================================
  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  editModalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },

  // Edit modal ka apna unique header style (pehle "modalHeader" naam se
  // Details modal wale se clash ho raha tha aur silently overwrite ho raha tha)
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "black",
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 12,
    marginBottom: 5,
  },

  editInput: {
    borderWidth: 1,
    borderColor: Colors.SAGE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: "black",
    backgroundColor: "white",
  },

  editTextArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },

  editButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
    marginBottom: 10,
  },

  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  cancelText: {
    fontWeight: "600",
    color: "black",
  },

  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Colors.SAGE,
    minWidth: 120,
    alignItems: "center",
  },

  saveText: {
    color: "white",
    fontWeight: "600",
  },

  // =====================================================
  // DETAILS MODAL
  // =====================================================

  detailsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  detailsModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "85%",
  },

  // Details modal ka apna unique header style
  detailsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  detailsModalTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: "black",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  detailBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  detailLabel: {
    fontSize: 12,
    color: "gray",
    marginBottom: 5,
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 15,
    color: "black",
    lineHeight: 22,
  },

  modalEditButton: {
    backgroundColor: Colors.SAGE,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },

  modalEditText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
};
