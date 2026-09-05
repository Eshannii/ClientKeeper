import notifee, {
  AndroidImportance,
  TriggerType,
  AuthorizationStatus,
} from "@notifee/react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../config/FirebaseConfig";

// ---------- SETUP (app start pe ek baar call karo) ----------
export async function setupNotifications() {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    console.log("Notification permission denied");
    return false;
  }

  await notifee.createChannel({
    id: "hearings",
    name: "Hearing Reminders",
    importance: AndroidImportance.HIGH,
  });

  return true;
}

// Helper: kisi date se "daysBefore" din pehle ka din nikal ke, us din
// (hours, minutes) time set kar ke Date object return karta hai
function getDateAtTime(baseDate, daysBefore, hours, minutes) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - daysBefore);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ---------- FUNCTION 1: Prep reminders (3 din pehle + 1 din pehle) ----------
// Har din 3 baar notification: subah 9, dopehar 4:30, raat 9
export async function scheduleHearingPrepReminders({
  hearingId,
  clientName,
  hearingDate,
}) {
  const times = [
    { hours: 9, minutes: 0 }, // subah 9 baje
    { hours: 16, minutes: 30 }, // dopehar 4:30 baje
    { hours: 21, minutes: 0 }, // raat 9 baje
  ];

  const daysBeforeList = [3, 1]; // 3 din pehle aur 1 din pehle
  const scheduledIds = [];

  for (const daysBefore of daysBeforeList) {
    for (const time of times) {
      const triggerDate = getDateAtTime(
        hearingDate,
        daysBefore,
        time.hours,
        time.minutes,
      );

      // Agar ye time already guzar chuka hai to skip karo
      if (triggerDate.getTime() <= Date.now()) continue;

      const notifId = `hearing-prep-${hearingId}-d${daysBefore}-${time.hours}${time.minutes}`;

      await notifee.createTriggerNotification(
        {
          id: notifId,
          title: "Hearing Reminder",
          body: `${clientName} ki hearing ${daysBefore} din baad hai — case prepare kar lein`,
          android: {
            channelId: "hearings",
            pressAction: { id: "default" },
          },
        },
        { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() },
      );

      scheduledIds.push(notifId);
    }
  }

  return scheduledIds;
}

// ---------- FUNCTION 2: Hearing wale din "Best of luck" notification ----------
export async function scheduleHearingDayNotification({
  hearingId,
  name,
  hearingDate,
}) {
  // Hearing wale din subah 9 baje bhej dete hain
  const triggerDate = getDateAtTime(hearingDate, 0, 9, 0);

  if (triggerDate.getTime() <= Date.now()) {
    console.log("Hearing day 9am already past, skipping");
    return null;
  }

  const notifId = `hearing-day-${hearingId}`;

  await notifee.createTriggerNotification(
    {
      id: notifId,
      title: "Aaj Hearing Hai!",
      body: `${name} ki hearing aaj hai — Best of luck! 🍀`,
      android: {
        channelId: "hearings",
        pressAction: { id: "default" },
      },
    },
    { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() },
  );

  return notifId;
}

// ---------- CANCEL: agar hearing date change ho ya case delete ho ----------
export async function cancelHearingNotifications(hearingId) {
  const daysBeforeList = [3, 1];
  const times = [
    { hours: 9, minutes: 0 },
    { hours: 16, minutes: 30 },
    { hours: 21, minutes: 0 },
  ];

  for (const daysBefore of daysBeforeList) {
    for (const time of times) {
      await notifee.cancelNotification(
        `hearing-prep-${hearingId}-d${daysBefore}-${time.hours}${time.minutes}`,
      );
    }
  }
  await notifee.cancelNotification(`hearing-day-${hearingId}`);
}

// ---------- FETCH ALL: Firestore se sab hearings fetch karke notifications (re)schedule karo ----------
// Ye app start / login ke baad call karo, taake purane saved cases ke liye bhi reminders lag jayein
export async function scheduleAllHearingNotifications() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log("No logged in user, skipping hearing notifications fetch");
    return;
  }

  try {
    const q = query(
      collection(db, "hearing"),
      where("userEmail", "==", currentUser.email),
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      if (!data.nextDate) continue; // agar nextDate hi save nahi hui to skip karo

      const hearingDate = new Date(data.nextDate);

      await scheduleHearingPrepReminders({
        hearingId: data.docId,
        clientName: data.name,
        hearingDate,
      });

      await scheduleHearingDayNotification({
        hearingId: data.docId,
        name: data.name,
        hearingDate,
      });
    }

    console.log(`Scheduled notifications for ${snapshot.size} hearings`);
  } catch (e) {
    console.log("Error scheduling hearing notifications:", e);
  }
}
