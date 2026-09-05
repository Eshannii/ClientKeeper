import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  GetDateRangeToDisplay,
  formatDateForText,
} from "./../service/ConvertDateTime";
import Colors from "../constants/Colors";
import moment from "moment";
import { getLocalStorage } from "../service/Storage";
import { collection, getDocs, where, query } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import CaseCardItem from "./CaseCardItem";
import EmptyState from "./EmptyState";

const CaseListByDate = () => {
  const [allCases, setAllCases] = useState([]);
  const [caseList, setCaseList] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format("L"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GetDateRangeList();
    GetAllCases();
  }, []);

  useEffect(() => {
    FilterCasesByDate(selectedDate);
  }, [allCases, selectedDate]);

  const GetDateRangeList = () => {
    const dateRange = GetDateRangeToDisplay();
    setDateRange(dateRange);
  };

  // Saari hearings ek dafa fetch karo user ki
  const GetAllCases = async () => {
    setLoading(true);
    const user = await getLocalStorage("userDetail");
    try {
      const q = query(
        collection(db, "hearing"),
        where("userEmail", "==", user?.email),
      );
      const querySnapShot = await getDocs(q);
      const results = [];
      querySnapShot.forEach((doc) => {
        results.push(doc.data());
      });
      setAllCases(results);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  // Selected date ke hisaab se filter karo — sirf usi din ki nextDate wali hearings
  const FilterCasesByDate = (date) => {
    const filtered = allCases.filter(
      (item) => formatDateForText(item.nextDate) === date,
    );
    setCaseList(filtered);
  };

  return (
    <View style={{ marginTop: 10 }}>
      {/*<Image
        source={require("./../assets/images/case.jpg")}
        style={{
          width: "100%",
          height: 200,
          borderRadius: 15,
        }}
      />*/}
      <FlatList
        style={{
          marginTop: 15,
        }}
        data={dateRange}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 5, paddingHorizontal: 2 }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => setSelectedDate(item.formatedDate)}
            style={[
              styles.dateGroup,
              {
                backgroundColor:
                  item.formatedDate == selectedDate ? Colors.YELLOW : "white",
                borderColor:
                  item.formatedDate == selectedDate
                    ? Colors.YELLOW
                    : Colors.SAGE,
              },
            ]}
          >
            <Text
              style={[
                styles.day,
                {
                  color:
                    item.formatedDate == selectedDate
                      ? Colors.PRIMARY
                      : Colors.GRAY,
                },
              ]}
            >
              {item.day}
            </Text>
            <Text
              style={[
                styles.date,
                {
                  color: Colors.PRIMARY,
                },
              ]}
            >
              {item.date}
            </Text>
          </TouchableOpacity>
        )}
      />
      {caseList.length > 0 ? (
        <FlatList
          data={caseList}
          scrollEnabled={false}
          onRefresh={GetAllCases}
          refreshing={loading}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => <CaseCardItem caseCard={item} />}
        />
      ) : (
        <EmptyState />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateGroup: {
    width: 60,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderRadius: 15,
    borderWidth: 1.5,
    // subtle shadow taake card jaisa look aaye
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  day: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  date: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 2,
  },
});

export default CaseListByDate;
