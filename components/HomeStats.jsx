import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, where, query } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { getLocalStorage } from "../service/Storage";
import Colors from "../constants/Colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatedDate } from "./../service/ConvertDateTime";
const HomeStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    upcomingHearings: 0,
    totalCases: 0,
    pendingFilings: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getLocalStorage("userDetail");
      if (!user?.email) {
        setLoading(false);
        return;
      }

      // Clients
      const clientsQ = query(
        collection(db, "clients"),
        where("userEmail", "==", user.email),
      );
      const clientsSnap = await getDocs(clientsQ);
      const clients = [];
      clientsSnap.forEach((d) => clients.push({ id: d.id, ...d.data() }));

      // Hearings (upcoming = date in the future)
      // nextDate ko Firestore Timestamp ho ya plain string/number, sab handle karo
      const toJsDate = (nextDate) => {
        if (
          nextDate &&
          typeof nextDate === "object" &&
          nextDate?.seconds !== undefined
        ) {
          return new Date(nextDate.seconds * 1000);
        }
        return nextDate ? new Date(nextDate) : null;
      };

      // Hearings (upcoming = date in the future)
      const hearingQ = query(
        collection(db, "hearing"),
        where("userEmail", "==", user.email),
      );
      const hearingSnap = await getDocs(hearingQ);
      let upcomingCount = 0;
      const now = new Date();
      hearingSnap.forEach((d) => {
        const data = d.data();
        const hearingDate = toJsDate(data?.nextDate);
        if (hearingDate && hearingDate >= now) {
          upcomingCount++;
        }
      });

      // Pending filings (Income Tax / Sales Tax clients without a filing for the current period)
      const incomeTaxPeriod = getCurrentIncomeTaxYear();
      const salesTaxPeriod = getCurrentSalesTaxPeriod();
      let pendingCount = 0;

      for (const client of clients) {
        const typeName = client?.type?.name;
        if (typeName !== "Income Tax" && typeName !== "Sales Tax") continue;

        const period =
          typeName === "Income Tax" ? incomeTaxPeriod : salesTaxPeriod;
        const filingsSnap = await getDocs(
          collection(db, "clients", client.id, "filings"),
        );
        const filed = filingsSnap.docs.some((d) => d.id === period);
        if (!filed) pendingCount++;
      }

      setStats({
        totalClients: clients.length,
        upcomingHearings: upcomingCount,
        totalCases: hearingSnap.size,
        pendingFilings: pendingCount,
      });
    } catch (e) {
      console.log("HomeStats error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentIncomeTaxYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 6) return `${year}-${(year + 1).toString().slice(-2)}`;
    return `${year - 1}-${year.toString().slice(-2)}`;
  };

  const getCurrentSalesTaxPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const statCards = [
    {
      key: "clients",
      label: "Total Clients",
      value: stats.totalClients,
      icon: <FontAwesome5 name="users" size={18} color="white" />,
      color: Colors.DARK_BLUE,
    },
    {
      key: "hearings",
      label: "Upcoming Hearings",
      value: stats.upcomingHearings,
      icon: <Ionicons name="calendar" size={20} color="white" />,
      color: "#E67E22",
    },
    {
      key: "cases",
      label: "Total Cases",
      value: stats.totalCases,
      icon: <MaterialIcons name="gavel" size={20} color="white" />,
      color: "#27AE60",
    },
    {
      key: "pending",
      label: "Pending Filings",
      value: stats.pendingFilings,
      icon: <MaterialIcons name="pending-actions" size={20} color="white" />,
      color: "#C0392B",
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={Colors.DARK_BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.statsContainer}>
      {statCards.map((card) => (
        <View key={card.key} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: card.color }]}>
              {card.icon}
            </View>

            <Text style={styles.value}>{card.value}</Text>
          </View>

          <Text style={styles.label}>{card.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingWrap: {
    marginTop: 15,
    paddingVertical: 20,
    alignItems: "center",
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 2,
  },

  card: {
    backgroundColor: "white",
    width: "48%",
    minHeight: 105,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: "#EEEEEE",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  label: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 12,
    fontWeight: "500",
  },
});

export default HomeStats;
