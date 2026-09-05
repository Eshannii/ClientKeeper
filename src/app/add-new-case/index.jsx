import { View, Text } from "react-native";
import React from "react";
import AddCaseHeader from "../../../components/AddCaseHeader";
import AddNewCaseForm from "../../../components/AddCaseForm";
const AddNewCase = () => {
  return (
    <View style={{ flex: 1 }}>
      <AddCaseHeader />
      <AddNewCaseForm />
    </View>
  );
};

export default AddNewCase;
