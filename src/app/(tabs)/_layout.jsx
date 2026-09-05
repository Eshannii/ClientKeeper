import { View, Text } from "react-native";
import React, { use, useEffect, useState } from "react";
import { Tabs } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../../config/FirebaseConfig";
import { getLocalStorage } from "../../../service/Storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
export default function TabLayout() {
  const router = useRouter();
  useEffect(() => {
    GetUserDetail();
  }, []);
  const GetUserDetail = async () => {
    const userInfo = await getLocalStorage("userDetail");
    if (!userInfo) {
      router.replace("/login");
    }
  };

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="home" size={24} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="AddTax"
        options={{
          tabBarLabel: "Tax",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="money-bills" size={24} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="AddDiary"
        options={{
          tabBarLabel: "Diary",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="book" size={24} color="black" />
          ),
        }}
      />
      <Tabs.Screen
        name="Notes"
        options={{
          tabBarLabel: "Notes",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notes" size={24} color="black" />
          ),
        }}
      />
    </Tabs>
  );
}
