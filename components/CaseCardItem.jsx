import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { formatDateForText } from "../service/ConvertDateTime";
import Colors from "../constants/Colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import CaseDetail from "./CaseDetail";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { db } from "../config/FirebaseConfig";

const toJsDate = (nextDate) => {
  if (
    nextDate &&
    typeof nextDate === "object" &&
    nextDate?.seconds !== undefined
  ) {
    return new Date(nextDate.seconds * 1000);
  }
  return nextDate ? new Date(nextDate) : new Date();
};
export default function CaseCardItem({ caseCard, onDeleted }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(caseCard?.name || "");
  const [editSaving, setEditSaving] = useState(false);
  const [editDate, setEditDate] = useState(toJsDate(caseCard?.nextDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const handleDelete = () => {
    Alert.alert(
      "Delete Case",
      `Kya aap "${caseCard?.name}" case delete karna chahte hain?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "hearing", caseCard.id));
              onDeleted?.(caseCard.id);
            } catch (e) {
              console.log(e);
              Alert.alert("Error", "Case delete nahi ho saka");
            }
          },
        },
      ],
    );
  };

  const openEditModal = () => {
    setEditName(caseCard?.name || "");
    setEditDate(toJsDate(caseCard?.nextDate));
    setEditModalVisible(true);
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios"); // iOS pe inline rehta hai
    if (selectedDate) {
      setEditDate(selectedDate);
    }
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Please enter case name");
      return;
    }
    setEditSaving(true);
    try {
      await updateDoc(doc(db, "hearing", caseCard.id), {
        name: editName.trim(),
        nextDate: editDate.toISOString(),
      });
      setEditModalVisible(false);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Case update nahi ho saka");
    } finally {
      setEditSaving(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("./../assets/images/timetable.png")}
          style={{
            width: 40,
            height: 40,
          }}
        />
      </View>
      <View style={styles.subContainer}>
        <View style={styles.textContainer}>
          <Text
            style={{ fontSize: 14, fontWeight: "bold", color: Colors.PRIMARY }}
          >
            {caseCard?.name}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.PRIMARY }}>
            {formatDateForText(caseCard?.nextDate)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={openEditModal}>
            <MaterialIcons name="edit" size={20} color={Colors.PRIMARY} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons
              name="navigate-next"
              size={24}
              color={Colors.PRIMARY}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <CaseDetail
          caseCard={caseCard}
          onClose={() => setModalVisible(false)}
        />
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Case</Text>

            <Text style={styles.modalLabel}>Case Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Case name"
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.modalLabel}>Next Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{moment(editDate).format("DD MMM YYYY")}</Text>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color={Colors.PRIMARY}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onChangeDate}
              />
            )}

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
                  { backgroundColor: Colors.PRIMARY },
                ]}
                onPress={saveEdit}
                disabled={editSaving}
              >
                <Text style={{ color: "white" }}>
                  {editSaving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 15,
    marginRight: 15,
  },
  container: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.ORANGE,
    marginTop: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  subContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    flexShrink: 1, // 👈 text ko container ke andar wrap hone deta hai
    minWidth: 0, // 👈 iske bagair flexShrink kaam nahi karta RN mein
    marginRight: 8,
  },
  iconButton: {
    flexShrink: 0, // 👈 icon kabhi compress/hide na ho
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
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
