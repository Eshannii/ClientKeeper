import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import Colors from "../constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TypeList } from "../constants/Options";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Foundation from "@expo/vector-icons/Foundation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/FirebaseConfig";
import { useRouter } from "expo-router";

const AddClientForm = () => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const router = useRouter();

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Free checkbox toggle karne ka handler
  const toggleFree = () => {
    const newValue = !isFree;
    setIsFree(newValue);
    onHandleInputChange("fees", newValue ? "Free" : "");
  };

  // Firebase Auth ke ready hone ka wait karta hai, phir current user return karta hai
  const getCurrentUser = () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  };

  const SaveClient = async () => {
    if (
      !formData?.name ||
      !formData?.type ||
      !formData?.cnic ||
      !formData?.phone ||
      !formData?.fees
    ) {
      Alert.alert("Please fill all fields");
      return;
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      Alert.alert("Error", "Please login again");
      return;
    }

    const docId = Date.now().toString();

    setLoading(true);
    try {
      await setDoc(doc(db, "clients", docId), {
        ...formData,
        userEmail: currentUser.email,
        docId: docId,
      });
      setLoading(false);
      Alert.alert("Success", "Client added successfully", [
        {
          text: "ok",
          onPress: () => router.push("(tabs)"),
        },
      ]);
      setFormData({});
      setIsFree(false);
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
        <Text style={styles.header}>Add New Tax Client</Text>

        <Text style={styles.label}>Client Name</Text>
        <View style={styles.inputGroup}>
          <Ionicons
            style={styles.icon}
            name="person-add-outline"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Client Name"
            placeholderTextColor={Colors.GRAY}
            value={formData?.name || ""}
            onChangeText={(value) => onHandleInputChange("name", value)}
          />
        </View>

        {/* Tax Type*/}
        <Text style={styles.label}>Tax Type</Text>
        <FlatList
          data={TypeList}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.inputGroup,
                { marginRight: 10 },
                {
                  backgroundColor:
                    item.name == formData?.type?.name
                      ? Colors.PRIMARY
                      : "white",
                },
              ]}
              onPress={() => onHandleInputChange("type", item)}
            >
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      item.name == formData?.type?.name ? "white" : "black",
                  },
                ]}
              >
                {item?.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/*cnic*/}
        <Text style={styles.label}>CNIC</Text>
        <View style={styles.inputGroup}>
          <FontAwesome5
            style={styles.icon}
            name="id-card"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            placeholder="CNIC Ex. xxxxx-xxxxxxx-x"
            placeholderTextColor={Colors.GRAY}
            keyboardType="numeric"
            value={formData?.cnic || ""}
            onChangeText={(value) => onHandleInputChange("cnic", value)}
          />
        </View>

        {/*phone*/}
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputGroup}>
          <Foundation
            style={styles.icon}
            name="telephone"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Phone# Ex. +92 xxx xxxxxxx"
            placeholderTextColor={Colors.GRAY}
            keyboardType="phone-pad"
            value={formData?.phone || ""}
            onChangeText={(value) => onHandleInputChange("phone", value)}
          />
        </View>

        {/*password*/}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputGroup}>
          <MaterialIcons
            style={styles.icon}
            name="password"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            secureTextEntry={true}
            placeholder="Password Ex. ********"
            placeholderTextColor={Colors.GRAY}
            value={formData?.password || ""}
            onChangeText={(value) => onHandleInputChange("password", value)}
          />
        </View>

        {/*fee*/}
        <Text style={styles.label}>Fee</Text>
        <View style={styles.inputGroup}>
          <FontAwesome5
            style={styles.icon}
            name="money-check"
            size={24}
            color="black"
          />
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            placeholder="Fee i.e Rs.1000"
            placeholderTextColor={Colors.GRAY}
            editable={!isFree}
            value={isFree ? "Free" : formData?.fees || ""}
            onChangeText={(value) => onHandleInputChange("fees", value)}
          />
        </View>

        {/* Free checkbox */}
        <TouchableOpacity style={styles.freeCheckbox} onPress={toggleFree}>
          <Ionicons
            name={isFree ? "checkbox" : "square-outline"}
            size={22}
            color={Colors.PRIMARY}
          />
          <Text style={styles.freeText}>Mark this case as Free</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={SaveClient}>
          {loading ? (
            <ActivityIndicator size={"large"} color={"white"} />
          ) : (
            <Text style={styles.buttonText}>Add New Tax Client</Text>
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
    borderColor: Colors.BLUE,
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
    borderColor: Colors.BLUE,
  },
  typeText: {
    fontSize: 16,
  },
  freeCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  freeText: {
    fontSize: 15,
    color: Colors.PRIMARY,
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.DARK_BLUE,
    borderRadius: 15,
    width: "100%",
  },
  buttonText: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
  },
});

export default AddClientForm;
