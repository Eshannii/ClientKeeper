import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../constants/Colors";
import { getLocalStorage } from "../service/Storage";
import {
  collection,
  getDocs,
  where,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TypeList } from "../constants/Options";
import TaxEmptyState from "./TaxEmptyState";

const TaxList = () => {
  const [clientList, setClientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    GetClientList();
  }, []);

  const GetClientList = async () => {
    setLoading(true);
    const user = await getLocalStorage("userDetail");
    setClientList([]);
    try {
      const q = query(
        collection(db, "clients"),
        where("userEmail", "==", user?.email),
      );
      const querySnapShot = await getDocs(q);
      const results = [];
      querySnapShot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      setClientList(results);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };
  const handleDeleteClient = (item) => {
    Alert.alert(
      "Delete Client",
      `Kya aap "${item?.name}" ko delete karna chahte hain? Ye action wapas nahi ho sakta.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "clients", item.id));
              setClientList((prev) => prev.filter((c) => c.id !== item.id));
            } catch (e) {
              console.log(e);
              Alert.alert(
                "Error",
                "Client delete nahi ho saka, dobara try karein.",
              );
            }
          },
        },
      ],
    );
  };
  // Helper: client free hai ya paid, "fees" field ke basis par
  const isFreeClient = (item) =>
    String(item?.fees).trim().toLowerCase() === "free";

  // Filter logic - tax type (Income/Sales) ya fee status (Free/Paid) ke basis par
  const getFilteredList = () => {
    if (activeFilter === "all") return clientList;
    if (activeFilter === "free") return clientList.filter(isFreeClient);
    if (activeFilter === "paid")
      return clientList.filter((item) => !isFreeClient(item));
    return clientList.filter((item) => item?.type?.name === activeFilter);
  };

  const filteredList = getFilteredList();

  // Counts - har category ka total number
  const totalCount = clientList.length;
  const freeCount = clientList.filter(isFreeClient).length;
  const paidCount = clientList.filter((item) => !isFreeClient(item)).length;

  return (
    <View style={{ marginTop: 25, padding: 15 }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Tax Consultancy</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.pendingButton}
            onPress={() => router.push("/pending-filing")}
          >
            <MaterialIcons name="pending-actions" size={20} color="white" />
            <Text style={styles.pendingButtonText}>Pending Filing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/add-new-client")}
          >
            <MaterialIcons name="add" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Counts / Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 15 }}
      >
        <View style={styles.statBox}>
          <Text style={styles.statCount}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        {TypeList.map((type) => {
          const count = clientList.filter(
            (c) => c?.type?.name === type.name,
          ).length;
          return (
            <View key={type.name} style={styles.statBox}>
              <Text style={styles.statCount}>{count}</Text>
              <Text style={styles.statLabel}>{type.name}</Text>
            </View>
          );
        })}

        <View style={styles.statBox}>
          <Text style={styles.statCount}>{freeCount}</Text>
          <Text style={styles.statLabel}>Free</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statCount}>{paidCount}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
      </ScrollView>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 15 }}
      >
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setActiveFilter("all")}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === "all" ? Colors.DARK_BLUE : "white",
                borderColor: Colors.DARK_BLUE,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === "all" ? "white" : Colors.DARK_BLUE },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {TypeList.map((filter) => (
            <TouchableOpacity
              key={filter.name}
              onPress={() => setActiveFilter(filter.name)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    activeFilter === filter.name ? Colors.DARK_BLUE : "white",
                  borderColor: Colors.DARK_BLUE,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === filter.name ? "white" : Colors.DARK_BLUE,
                  },
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => setActiveFilter("free")}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === "free" ? Colors.DARK_BLUE : "white",
                borderColor: Colors.DARK_BLUE,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === "free" ? "white" : Colors.DARK_BLUE },
              ]}
            >
              Free
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter("paid")}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === "paid" ? Colors.DARK_BLUE : "white",
                borderColor: Colors.DARK_BLUE,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === "paid" ? "white" : Colors.DARK_BLUE },
              ]}
            >
              Paid
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Client List - normal card view */}
      {filteredList.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{item?.name}</Text>
                <Text style={styles.cnicText}>CNIC: {item?.cnic}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 6,
                    gap: 10,
                  }}
                >
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item?.type?.name}</Text>
                  </View>
                  <Text
                    style={[
                      styles.feeText,
                      isFreeClient(item) && { color: "green" },
                    ]}
                  >
                    {isFreeClient(item) ? "Free" : `Rs. ${item?.fees}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.filingButton}
                onPress={() => router.push(`/client-filing/${item.id}`)}
              >
                <MaterialIcons name="description" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteClient(item)}
              >
                <MaterialIcons name="delete" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <TaxEmptyState selectedDate={null} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
  },
  addButton: {
    backgroundColor: Colors.DARK_BLUE,
    padding: 10,
    borderRadius: 50,
  },
  statBox: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    alignItems: "center",
    minWidth: 70,
  },
  statCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.DARK_BLUE,
  },
  statLabel: {
    fontSize: 12,
    color: "gray",
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  cnicText: {
    fontSize: 13,
    color: "gray",
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: Colors.DARK_BLUE + "20",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.DARK_BLUE,
  },
  feeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
  },
  filingButton: {
    backgroundColor: Colors.DARK_BLUE,
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  pendingButton: {
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.DARK_BLUE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
    gap: 6,
  },
  pendingButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#E74C3C",
    padding: 10,
    borderRadius: 50,
    marginLeft: 8,
  },
});

export default TaxList;
