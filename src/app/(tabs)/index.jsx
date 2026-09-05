import { View, Text, Button, ScrollView } from "react-native";
import React from "react";
import { auth } from "../../../config/FirebaseConfig";
import { signOut } from "firebase/auth";
import { RemoveLocalStorage } from "../../../service/Storage";
import Header from "../../../components/Header";
import EmptyState from "../../../components/EmptyState";
import CaseList from "../../../components/CaseList";
import CaseListByDate from "../../../components/CaseListByDate";
import HomeStats from "../../../components/HomeStats";
export default function HomeScreen() {
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        RemoveLocalStorage("userDetail");
        console.log("Signed out successfully");
      })
      .catch((error) => console.log("Sign out error:", error));
  };

  return (
    <ScrollView
      style={{
        backgroundColor: "white",
      }}
      contentContainerStyle={{
        padding: 25,
        paddingBottom: 60,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Header />
      <HomeStats />
      <CaseListByDate />
    </ScrollView>
  );
}
