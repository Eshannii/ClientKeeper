import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import Colors from "../../../constants/Colors";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../config/FirebaseConfig";
import { setLocalStorage, toPlainUser } from "../../../service/Storage";

const SignIn = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert(
        "Incomplete Information",
        "Please fill in all fields before signing in.",
        [{ text: "OK" }],
      );

      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await setLocalStorage("userDetail", toPlainUser(user));
        router.replace("/(tabs)"); // login successful ke baad kahan jaana hai
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        if (errorCode === "auth/user-not-found") {
          Alert.alert(
            "User Not Found",
            "No account found with this email. Please sign up first.",
            [
              {
                text: "OK",
                onPress: () => router.push("/login/signUp"),
              },
            ],
          );
        } else {
          Alert.alert("Login Failed", errorMessage, [{ text: "OK" }]);
        }
      });
  };

  return (
    <View style={{ marginTop: 40, padding: 25 }}>
      <Text style={styles.textHeader}>Let's Sign You In</Text>
      <Text style={styles.subText}>Welcome Back</Text>
      <Text style={styles.subText}>You've been missed!</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={{ fontSize: 17, color: "white", fontWeight: "bold" }}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonCreate}
        onPress={() => router.push("/login/signUp")}
      >
        <Text
          style={{ fontSize: 17, color: Colors.PRIMARY, fontWeight: "bold" }}
        >
          Create an Account
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
    marginTop: 35,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
});

export default SignIn;
