import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import Colors from "../constants/Colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { FormatDate, formatDateForText } from "../service/ConvertDateTime";
import { useRouter } from "expo-router";

const AddCaselaw = () => {
  const [formData, setFormData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onJudgementDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      onHandleInputChange("judgementDate", FormatDate(selectedDate));
    }
  };

  const SaveCaselaw = async () => {
    if (
      !formData?.caseNo ||
      !formData?.caseTitle ||
      !formData?.judgeName ||
      !formData?.courtName ||
      !formData?.judgementDate
    ) {
      Alert.alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    const currentUser = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!currentUser) {
      setLoading(false);
      Alert.alert("Error", "Please login again");
      return;
    }

    const docId = Date.now().toString();

    try {
      await setDoc(doc(db, "caselaws", docId), {
        ...formData,
        userEmail: currentUser.email,
        docId: docId,
      });
      setLoading(false);
      Alert.alert("Success", "Research note added successfully", [
        {
          text: "ok",
          onPress: () => router.back(),
        },
      ]);
    } catch (e) {
      setLoading(false);
      console.log(e);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("./../assets/images/notes.png")}
          style={{ height: 220, width: "100%" }}
        />

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.header}>Add Research Notes</Text>

          <Text style={styles.label}>Case No.</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              style={styles.icon}
              size={20}
              name="file-document-outline"
            />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Petition No. 000 of YYYY"
              placeholderTextColor={Colors.GRAY}
              onChangeText={(value) => onHandleInputChange("caseNo", value)}
            />
          </View>

          <Text style={styles.label}>Case Title</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              style={styles.icon}
              size={20}
              name="briefcase-outline"
            />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Gill Vs Maliks"
              placeholderTextColor={Colors.GRAY}
              onChangeText={(value) => onHandleInputChange("caseTitle", value)}
            />
          </View>

          <Text style={styles.label}>Judge Name</Text>
          <View style={styles.inputGroup}>
            <FontAwesome5
              style={styles.icon}
              name="user-tie"
              size={20}
              color="black"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Judge Name"
              placeholderTextColor={Colors.GRAY}
              onChangeText={(value) => onHandleInputChange("judgeName", value)}
            />
          </View>

          <Text style={styles.label}>Court Name</Text>
          <View style={styles.inputGroup}>
            <Ionicons
              style={styles.icon}
              name="business-outline"
              size={20}
              color="black"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Court Name"
              placeholderTextColor={Colors.GRAY}
              onChangeText={(value) => onHandleInputChange("courtName", value)}
            />
          </View>

          <Text style={styles.label}>Case Category</Text>
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              style={styles.icon}
              size={20}
              name="tag-outline"
            />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Tax, Corporate, Criminal"
              placeholderTextColor={Colors.GRAY}
              onChangeText={(value) => onHandleInputChange("category", value)}
            />
          </View>

          <Text style={styles.label}>Date Of Judgement</Text>
          <TouchableOpacity
            style={styles.inputGroup}
            onPress={() => setShowDatePicker(true)}
          >
            <Fontisto style={styles.icon} name="date" size={20} color="black" />
            <Text style={styles.text}>
              {formData?.judgementDate
                ? formatDateForText(formData.judgementDate)
                : "Date Of Judgement"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={
                formData?.judgementDate
                  ? new Date(formData.judgementDate)
                  : new Date()
              }
              mode="date"
              display="default"
              onChange={onJudgementDateChange}
            />
          )}

          <Text style={styles.label}>Reported As</Text>
          <View style={styles.inputGroup}>
            <Foundation
              style={styles.icon}
              name="clipboard-notes"
              size={20}
              color="black"
            />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. PLC 13"
              placeholderTextColor={Colors.GRAY}
              onChangeText={(value) => onHandleInputChange("reportedAs", value)}
            />
          </View>

          <Text style={styles.label}>Judgement Notes</Text>
          <View style={[styles.inputGroup, styles.textAreaGroup]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Judgement Notes..."
              placeholderTextColor={Colors.GRAY}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              onChangeText={(value) =>
                onHandleInputChange("judgementDetails", value)
              }
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={SaveCaselaw}>
            {loading ? (
              <ActivityIndicator size={"large"} color={"white"} />
            ) : (
              <Text style={styles.buttonText}>Save Research Note</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.SAGE,
    marginTop: 10,
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
    marginTop: 14,
    marginBottom: 4,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.SAGE,
    backgroundColor: "white",
  },
  textAreaGroup: {
    alignItems: "flex-start",
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "black",
  },
  textArea: {
    marginLeft: 0,
    minHeight: 100,
  },
  icon: {
    color: Colors.SAGE,
    borderRightWidth: 1,
    paddingRight: 10,
    borderColor: Colors.SAGE,
  },
  text: {
    fontSize: 16,
    padding: 10,
    color: "black",
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.SAGE,
    borderRadius: 15,
    width: "100%",
  },
  buttonText: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
  },
});

export default AddCaselaw;
