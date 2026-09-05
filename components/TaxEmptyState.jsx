import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import ConstantString from "../constants/ConstantString";
import Colors from "../constants/Colors";
import { useRouter } from "expo-router";
const TaxEmptyState = () => {
  const router = useRouter();
  return (
    <View
      style={{
        marginTop: 150,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/*<Image
        source={require("./../assets/images/empty.png")}
        style={{ width: 200, height: 200 }}
      />*/}
      <Text
        style={{
          fontSize: 35,
          fontWeight: "bold",
          marginTop: 20,
        }}
      >
        {ConstantString.NoRecords}
      </Text>
      <Text
        style={{
          fontSize: 12,
          marginTop: 10,
          color: "gray",
          textAlign: "center",
        }}
      >
        {ConstantString.TaxRecordSubText}
      </Text>
      <View
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/*<TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/add-new-case")}
        >
          <Text style={styles.buttonText}>{ConstantString.AddNewCaseBtn}</Text>
        </TouchableOpacity>*/}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/add-new-client")}
        >
          <Text style={styles.buttonText}>
            {ConstantString.AddNewClientBtn}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.DARK_BLUE,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: "45%",
    display: "flex",
    alignItems: "center",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 14,
    color: "white",
  },
});
export default TaxEmptyState;
