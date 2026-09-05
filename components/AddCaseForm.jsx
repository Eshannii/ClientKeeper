import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../config/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import React, { useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Colors from "../constants/Colors";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  scheduleHearingPrepReminders,
  scheduleHearingDayNotification,
  showHearingAddedNotification,
} from "./../service/notification";
import notifee, { TriggerType } from "@notifee/react-native";

import {
  FormatDate,
  formatDateForText,
  getDatesRange,
} from "../service/ConvertDateTime";
import Foundation from "@expo/vector-icons/Foundation";
import { getLocalStorage } from "../service/Storage";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

const AddCaseForm = () => {
  const [formData, setFormData] = useState({});
  const [showLastDatePicker, setShowLastDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onLastDateChange = (event, selectedDate) => {
    setShowLastDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      onHandleInputChange("lastDate", FormatDate(selectedDate));
    }
  };

  const onNextDateChange = (event, selectedDate) => {
    setShowNextDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      onHandleInputChange("nextDate", FormatDate(selectedDate));
    }
  };

  const isFirstHearing = !formData?.lastDate;
  const nextDateLabel = isFirstHearing ? "First Hearing" : "Next Hearing Date";

  const SaveHearing = async () => {
    if (
      !formData?.name ||
      !formData?.judgeName ||
      !formData?.nextDate ||
      !formData?.proceeding
    ) {
      Alert.alert("Please fill all fields");
      return;
    }
    const dates = getDatesRange(formData?.lastDate, formData?.nextDate);
    setLoading(true);
    // Firebase Auth ke restore hone ka wait karo
    const currentUser = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!currentUser) {
      Alert.alert("Error", "Please login again");
      return;
    }

    const docId = Date.now().toString();

    console.log("Saving with userEmail:", currentUser.email);
    setLoading(true);
    try {
      await setDoc(doc(db, "hearing", docId), {
        ...formData,
        userEmail: currentUser.email,
        docId: docId,
        dates: dates,
      });
      await showHearingAddedNotification({
        name: formData.name,
        nextDate: formData.nextDate,
      });
      // Yahan add karo — notifications schedule karo
      const hearingDate = new Date(formData.nextDate);
      await scheduleHearingPrepReminders({
        hearingId: docId,
        clientName: formData.name,
        hearingDate,
      });
      await scheduleHearingDayNotification({
        hearingId: docId,
        clientName: formData.name,
        hearingDate,
      });

      setLoading(false);
      Alert.alert("Success", "Hearing added successfully", [
        {
          text: "ok",
          onPress: () => router.push("(tabs)"),
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
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Add New Case Hearing</Text>

        <Text style={styles.label}>Case Title</Text>
        <View style={styles.inputGroup}>
          <MaterialCommunityIcons
            style={styles.icon}
            size={20}
            name="briefcase-plus-outline"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Case Title"
            placeholderTextColor={Colors.GRAY}
            onChangeText={(value) => onHandleInputChange("name", value)}
          />
        </View>

        <Text style={styles.label}>Court Of</Text>
        <View style={styles.inputGroup}>
          <FontAwesome5
            style={styles.icon}
            name="user-tie"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Court Of"
            placeholderTextColor={Colors.GRAY}
            onChangeText={(value) => onHandleInputChange("judgeName", value)}
          />
        </View>

        {/* Last Hearing Date */}
        <Text style={styles.label}>Last Hearing Date</Text>
        <TouchableOpacity
          style={styles.inputGroup}
          onPress={() => setShowLastDatePicker(true)}
        >
          <Fontisto style={styles.icon} name="date" size={24} color="black" />
          <Text style={styles.text}>
            {formData?.lastDate
              ? formatDateForText(formData.lastDate)
              : "Last Hearing Date (optional)"}
          </Text>
        </TouchableOpacity>

        {showLastDatePicker && (
          <DateTimePicker
            value={
              formData?.lastDate ? new Date(formData.lastDate) : new Date()
            }
            mode="date"
            display="default"
            onChange={onLastDateChange}
          />
        )}

        {/* Next Hearing Date / First Hearing */}
        <Text style={styles.label}>{nextDateLabel}</Text>
        <TouchableOpacity
          style={styles.inputGroup}
          onPress={() => setShowNextDatePicker(true)}
        >
          <Fontisto style={styles.icon} name="date" size={24} color="black" />
          <Text style={styles.text}>
            {formData?.nextDate
              ? formatDateForText(formData.nextDate)
              : nextDateLabel}
          </Text>
        </TouchableOpacity>

        {showNextDatePicker && (
          <DateTimePicker
            value={
              formData?.nextDate ? new Date(formData.nextDate) : new Date()
            }
            mode="date"
            display="default"
            onChange={onNextDateChange}
          />
        )}

        {isFirstHearing && (
          <Text style={styles.hint}>
            Last date add nahi ki gayi — is case ko "First Hearing" maana
            jayega.
          </Text>
        )}

        <Text style={styles.label}>Proceeding</Text>
        <View style={styles.inputGroup}>
          <Foundation
            style={styles.icon}
            name="clipboard-notes"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Proceeding"
            placeholderTextColor={Colors.GRAY}
            onChangeText={(value) => onHandleInputChange("proceeding", value)}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={SaveHearing}>
          {loading ? (
            <ActivityIndicator size={"large"} color={"white"} />
          ) : (
            <Text style={styles.buttonText}>Add New Hearing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
    marginTop: 14,
    marginBottom: 4,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ORANGE,
    backgroundColor: "white",
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "black",
  },
  icon: {
    color: Colors.PRIMARY,
    borderRightWidth: 1,
    paddingRight: 10,
    borderColor: Colors.ORANGE,
  },
  text: {
    fontSize: 16,
    padding: 10,
    color: "black",
  },
  hint: {
    fontSize: 12,
    color: Colors.PRIMARY,
    marginTop: 6,
    fontStyle: "italic",
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.ORANGE,
    borderRadius: 15,
    width: "100%",
  },
  buttonText: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
  },
});

export default AddCaseForm;
