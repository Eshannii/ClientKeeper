import { ScrollView, Text, View } from "react-native";
import React, { Component } from "react";
import TaxList from "../../../components/TaxList";

export default class AddTax extends Component {
  render() {
    return (
      <ScrollView>
        <TaxList />
      </ScrollView>
    );
  }
}
