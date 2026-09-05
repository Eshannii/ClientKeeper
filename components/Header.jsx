import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { getLocalStorage, RemoveLocalStorage } from "../service/Storage";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Colors from "../constants/Colors";
import { signOut } from "firebase/auth";
import { auth } from "../config/FirebaseConfig";
import { useRouter } from "expo-router";

const Header = () => {
  const [user, setUser] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    GetUserDetail();
  }, []);

  const GetUserDetail = async () => {
    const userInfo = await getLocalStorage("userDetail");
    console.log("userInfo from storage:", JSON.stringify(userInfo));

    setUser(userInfo);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut(auth);
            await RemoveLocalStorage("userDetail");
            setSettingsVisible(false);
            router.replace("/login"); // apna actual login route yahan daal do agar alag hai
          } catch (e) {
            console.log("Logout error:", e);
            Alert.alert("Error", "Logout nahi ho saka, dobara try karein");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={{
        marginTop: 20,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={require("../assets/images/smile.png")}
            style={{ width: 35, height: 35 }}
          />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            Hello {user ? user.displayName : "User"}👋🏻
          </Text>
        </View>

        <TouchableOpacity onPress={() => setSettingsVisible(true)} hitSlop={10}>
          <AntDesign name="setting" size={25} color="black" />
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 35,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "black" }}
              >
                Settings
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                hitSlop={10}
              >
                <AntDesign name="close" size={22} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={loggingOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: "#FDECEC",
              }}
            >
              <MaterialIcons name="logout" size={22} color="#E74C3C" />
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#E74C3C" }}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Header;
