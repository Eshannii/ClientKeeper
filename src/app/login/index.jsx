import { View, Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import React from "react";
import Colors from "../../../constants/Colors";
import { useRouter } from "expo-router";
const LoginScreen = () => {
  const router = useRouter();

  return (
    <View>
      <View
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 40,
        }}
      >
        <Image
          source={require("../../../assets/images/login.png")}
          style={styles.image}
        />
      </View>
      <View
        style={{
          padding: 25,
          backgroundColor: Colors.PRIMARY,
          height: "100%",
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
          }}
        >
          Client Keeper: Your Personal Reminder App
        </Text>
        <Text
          style={{
            fontSize: 18,
            color: "white",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Track. Remind. Never miss.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("login/signIn")}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              color: Colors.PRIMARY,
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>
        <Text style={{ textAlign: "center", color: "white", marginTop: 20 }}>
          Note: By continuing, you agree to our Terms of Service and Privacy
          Policy.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 400,
    height: 490,
    borderRadius: 10,
  },
  button: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 99,
    marginTop: 25,
  },
});

export default LoginScreen;
