import { View, Text } from "react-native";
import React from "react";
import AddTaxHeader from "../../../components/AddTaxHeader";
import AddClientForm from "../../../components/AddClientForm";
const AddNewClient = () => {
  return (
    <View style={{ flex: 1 }}>
      <AddTaxHeader />
      <AddClientForm />
    </View>
  );
};

export default AddNewClient;
