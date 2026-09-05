import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../constants/Colors";
import { getLocalStorage } from "../service/Storage";
import { collection, getDocs, where, query } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import CaseCardItem from "./CaseCardItem";
import EmptyState from "./EmptyState";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import moment from "moment";

const FILTERS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "This Week", value: "thisWeek" },
  { label: "Previous", value: "previous" },
];

const CaseList = () => {
  const [caseList, setCaseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const router = useRouter();

  useEffect(() => {
    GetCaseList();
  }, []);

  const GetCaseList = async () => {
    setLoading(true);
    const user = await getLocalStorage("userDetail");
    setUserName(user?.displayName || "User");
    setCaseList([]);
    try {
      const q = query(
        collection(db, "hearing"),
        where("userEmail", "==", user?.email),
      );
      const querySnapShot = await getDocs(q);
      const results = [];
      querySnapShot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      setCaseList(results);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  // nextDate ko Firestore Timestamp ho ya plain number/string, sab handle karo
  // nextDate ko Firestore Timestamp ho ya plain number/string, sab handle karo
  // — ab native Date() use karke parse karta hai (jo baaki app mein bhi consistent hai)
  const getNextDateMoment = (nextDate) => {
    if (
      nextDate &&
      typeof nextDate === "object" &&
      nextDate?.seconds !== undefined
    ) {
      return moment(new Date(nextDate.seconds * 1000));
    }
    return moment(new Date(nextDate));
  };

  const getFilteredList = () => {
    const today = moment().startOf("day");

    if (activeFilter === "upcoming") {
      return caseList.filter((item) =>
        getNextDateMoment(item.nextDate).isSameOrAfter(today),
      );
    }

    if (activeFilter === "previous") {
      return caseList.filter((item) =>
        getNextDateMoment(item.nextDate).isBefore(today),
      );
    }

    if (activeFilter === "thisWeek") {
      const startOfWeek = moment().startOf("isoweek");
      const endOfWeek = moment().endOf("isoweek");
      return caseList.filter((item) =>
        getNextDateMoment(item.nextDate).isBetween(
          startOfWeek,
          endOfWeek,
          undefined,
          "[]",
        ),
      );
    }

    return caseList;
  };

  const filteredList = getFilteredList();

  return (
    <View style={{ marginTop: 25, padding: 25 }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>{userName}'s Diary</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-new-case")}
        >
          <MaterialIcons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {/*<Image
          source={require("./../assets/images/diary.png")}
          style={styles.diaryImage}
          resizeMode="contain"
        />*/}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => setActiveFilter(filter.value)}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === filter.value ? Colors.ORANGE : "white",
                borderColor: Colors.ORANGE,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    activeFilter === filter.value ? "white" : Colors.ORANGE,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredList.length > 0 ? (
        <FlatList
          data={filteredList}
          scrollEnabled={false}
          onRefresh={GetCaseList}
          refreshing={loading}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <CaseCardItem
              caseCard={item}
              onDeleted={(id) =>
                setCaseList((prev) => prev.filter((c) => c.id !== id))
              }
            />
          )}
        />
      ) : (
        <EmptyState selectedDate={null} />
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
    backgroundColor: Colors.ORANGE,
    padding: 10,
    borderRadius: 50,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  diaryImage: {
    width: 200,
    height: 200,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default CaseList;
