import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import Colors from "../../../constants/Colors";
import { getLocalStorage } from "../../../service/Storage";
import {
  collection,
  getDocs,
  where,
  query,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../config/FirebaseConfig";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  scheduleIncomeTaxReminders,
  scheduleSalesTaxReminders,
} from "../../../service/taxNotification";
// Pakistan income tax year: 1 July - 30 June. e.g. "2026-27"
const getCurrentIncomeTaxYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, June = 5, July = 6
  if (month >= 6) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
};

// Sales tax period: current month, e.g. "2026-08"
const getCurrentSalesTaxPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getSalesTaxLabel = (period) => {
  const [y, m] = period.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Income Tax", label: "Income Tax" },
  { key: "Sales Tax", label: "Sales Tax" },
];

const PendingFiling = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    loadPendingFilings();
  }, []);

  const loadPendingFilings = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getLocalStorage("userDetail");
      const q = query(
        collection(db, "clients"),
        where("userEmail", "==", user?.email),
      );
      const querySnapShot = await getDocs(q);
      const clients = [];
      querySnapShot.forEach((d) => clients.push({ id: d.id, ...d.data() }));

      const incomeTaxPeriod = getCurrentIncomeTaxYear();
      const salesTaxPeriod = getCurrentSalesTaxPeriod();
      const pending = [];

      for (const client of clients) {
        const typeName = client?.type?.name;

        if (typeName === "Income Tax") {
          const filingRef = doc(
            db,
            "clients",
            client.id,
            "filings",
            incomeTaxPeriod,
          );
          const filingSnap = await getDoc(filingRef);
          if (!filingSnap.exists()) {
            pending.push({
              ...client,
              period: incomeTaxPeriod,
              periodLabel: `Tax Year ${incomeTaxPeriod}`,
              filingType: "Income Tax",
            });
          }
        } else if (typeName === "Sales Tax") {
          const filingRef = doc(
            db,
            "clients",
            client.id,
            "filings",
            salesTaxPeriod,
          );
          const filingSnap = await getDoc(filingRef);
          if (!filingSnap.exists()) {
            pending.push({
              ...client,
              period: salesTaxPeriod,
              periodLabel: getSalesTaxLabel(salesTaxPeriod),
              filingType: "Sales Tax",
            });
          }
        }
      }

      setPendingList(pending);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not load pending filings");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsFiled = async (item) => {
    setMarkingId(`${item.id}_${item.period}`);
    try {
      const user = await getLocalStorage("userDetail");
      await setDoc(doc(db, "clients", item.id, "filings", item.period), {
        period: item.period,
        type: item.filingType,
        filedAt: new Date().toISOString(),
        filedBy: user?.email || null,
      });

      // Yahan add karo — recheck karo aur agar sab filed hain to notifications cancel ho jayein
      if (item.filingType === "Income Tax") {
        await scheduleIncomeTaxReminders();
      } else if (item.filingType === "Sales Tax") {
        await scheduleSalesTaxReminders();
      }

      setPendingList((prev) =>
        prev.filter((p) => !(p.id === item.id && p.period === item.period)),
      );
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not mark as filed");
    } finally {
      setMarkingId(null);
    }
  };

  const filteredList =
    activeFilter === "all"
      ? pendingList
      : pendingList.filter((item) => item.filingType === activeFilter);

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Pending Filing</Text>
        <TouchableOpacity onPress={loadPendingFilings} hitSlop={10}>
          <MaterialIcons name="refresh" size={22} color={Colors.DARK_BLUE} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs - full width, evenly spread */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.DARK_BLUE}
          style={{ marginTop: 40 }}
        />
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color="green" />
          <Text style={styles.emptyText}>
            Sab filings up to date hain, koi pending nahi 🎉
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredList.map((item) => {
            const key = `${item.id}_${item.period}`;
            return (
              <View key={key} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{item?.name}</Text>
                  <Text style={styles.cnicText}>CNIC: {item?.cnic}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {item.filingType}
                      </Text>
                    </View>
                    <Text style={styles.periodText}>{item.periodLabel}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.markButton}
                  onPress={() => markAsFiled(item)}
                  disabled={markingId === key}
                >
                  {markingId === key ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={16} color="white" />
                      <Text style={styles.markButtonText}>Mark Filed</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
  },
  headerText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "black",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.DARK_BLUE,
    alignItems: "center",
    backgroundColor: "white",
  },
  filterButtonActive: {
    backgroundColor: Colors.DARK_BLUE,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.DARK_BLUE,
  },
  filterTextActive: {
    color: "white",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 15,
    color: "gray",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
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
  periodText: {
    fontSize: 13,
    color: "gray",
  },
  markButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
    marginLeft: 12,
  },
  markButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default PendingFiling;
