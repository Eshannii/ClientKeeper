import { Stack } from "expo-router";
import { useEffect } from "react";
import notifee, { EventType } from "@notifee/react-native";
import {
  scheduleAllHearingNotifications,
  setupNotifications,
} from "../../service/notification";
import { scheduleAllTaxReminders } from "../../service/taxNotification";

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
    scheduleAllHearingNotifications();
    scheduleAllTaxReminders();
  }, []);
  useEffect(() => {
    setupNotifications();
    scheduleAllHearingNotifications();
  }, []);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
