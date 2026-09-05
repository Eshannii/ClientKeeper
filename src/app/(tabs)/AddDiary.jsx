import { Text, ScrollView } from "react-native";
import React, { Component } from "react";
import EmptyState from "../../../components/EmptyState";
import CaseList from "../../../components/CaseList";

export default class AddDiary extends Component {
  render() {
    return (
      <ScrollView
        style={{
          backgroundColor: "white",
        }}
      >
        {/*<EmptyState />*/}
        <CaseList />
      </ScrollView>
    );
  }
}
