import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { formatDateForText } from "../service/ConvertDateTime";
import Colors from "../constants/Colors";

export default function CaseDetail({ caseCard, onClose }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Details</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Case Title" value={caseCard?.name} />
        <DetailRow label="Court Of" value={caseCard?.judgeName} />
        <DetailRow
          label="Last Hearing Date"
          value={
            caseCard?.lastDate
              ? formatDateForText(caseCard.lastDate)
              : "First Hearing"
          }
        />
        <DetailRow
          label="Next Hearing Date"
          value={
            caseCard?.nextDate ? formatDateForText(caseCard.nextDate) : "N/A"
          }
        />
        <DetailRow label="Proceeding" value={caseCard?.proceeding} />
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "N/A"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
    marginLeft: 10,
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.SAGE,
    borderRadius: 15,
    padding: 15,
  },
  row: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    color: Colors.PRIMARY,
    opacity: 0.7,
    marginBottom: 3,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.PRIMARY,
  },
});
