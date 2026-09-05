import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

const AddTaxHeader = () => {
  const router = useRouter();
  return (
    <View>
      <Image
        source={require("./../assets/images/addTax.jpg")}
        style={{ width: "100%", height: 250 }}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          padding: 25,
        }}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back-circle-outline" size={40} color="black" />
      </TouchableOpacity>
    </View>
  );
};

export default AddTaxHeader;
