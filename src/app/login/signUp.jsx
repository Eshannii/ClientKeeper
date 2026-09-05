import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import Colors from "../../../constants/Colors";
import { auth } from "../../../config/FirebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setLocalStorage, toPlainUser } from "../../../service/Storage";
const SignUp = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = () => {
    if (!name || !email || !password) {
      Alert.alert(
        "Incomplete Information",
        "Please fill in all fields before signing up.",
        [{ text: "OK" }],
      );
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });

        // Firebase User object plain nahi hota (getters ke through fields aate hain),
        // isliye JSON.stringify se pehle plain object banao
        await setLocalStorage(
          "userDetail",
          toPlainUser(user, { displayName: name }),
        );

        router.push("(tabs)"); // signup ke baad kahan navigate karna hai
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        if (errorCode === "auth/email-already-in-use") {
          ToastAndroid.show(
            "Email already in use. Please try logging in.",
            ToastAndroid.BOTTOM,
          );
          Alert.alert(
            "Email already in use",
            "The email address is already associated with another account. Please try logging in.",
            [
              {
                text: "OK",
                onPress: () => router.push("/login"),
              },
            ],
          );
        } else {
          Alert.alert("Sign Up Failed", errorMessage, [{ text: "OK" }]);
        }
      });
  };

  return (
    <View style={{ marginTop: 40, padding: 25 }}>
      <Text style={styles.textHeader}>Let's Get You Started</Text>
      <Text style={styles.subText}>Create New Account</Text>

      <View style={{ marginTop: 25 }}>
        <Text>Full Name</Text>
        <TextInput
          placeholder="Enter your name"
          placeholderTextColor={Colors.GRAY}
          style={styles.textInput}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={{ marginTop: 25 }}>
        <Text>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor={Colors.GRAY}
          style={styles.textInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={{ marginTop: 25 }}>
        <Text>Password</Text>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor={Colors.GRAY}
          style={styles.textInput}
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={{ fontSize: 17, color: "white", fontWeight: "bold" }}>
          Sign Up
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonCreate}
        onPress={() => router.push("/login")}
      >
        <Text
          style={{ fontSize: 17, color: Colors.PRIMARY, fontWeight: "bold" }}
        >
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  textHeader: { fontSize: 25, fontWeight: "bold" },
  subText: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 10,
    color: Colors.ORANGE,
  },
  textInput: {
    padding: 10,
    borderWidth: 1,
    fontSize: 16,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: "white",
    color: "black", // ye line add karo
  },
  button: {
    padding: 20,
    backgroundColor: Colors.PRIMARY,
    marginTop: 35,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonCreate: {
    padding: 20,
    backgroundColor: "white",
    marginTop: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
});

export default SignUp;
