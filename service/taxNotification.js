import notifee, { TriggerType, AndroidImportance } from "@notifee/react-native";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { getLocalStorage } from "./Storage";

// ---------- Period labels (PendingFiling.jsx jaisa hi format) ----------

// Pakistan income tax year: 1 July - 30 June. e.g. "2026-27"
export function getCurrentIncomeTaxPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, July = 6
  if (month >= 6) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

// Sales tax period: current month, e.g. "2026-09"
export function getCurrentSalesTaxPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// ---------- Check: current user ke sab clients ne filing mark ki hai ya nahi ----------

async function getClientsByType(typeName) {
  const user = await getLocalStorage("userDetail");
  if (!user?.email) return [];

  const q = query(
    collection(db, "clients"),
    where("userEmail", "==", user.email),
  );
  const snap = await getDocs(q);
  const clients = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data?.type?.name === typeName) {
      clients.push({ id: d.id, ...data });
    }
  });
  return clients;
}

async function hasFiledPeriod(clientId, period) {
  const filingSnap = await getDoc(
    doc(db, "clients", clientId, "filings", period),
  );
  return filingSnap.exists();
}

export async function areAllClientsFiled(typeName, period) {
  const clients = await getClientsByType(typeName);
  if (clients.length === 0) return true;

  for (const client of clients) {
    const filed = await hasFiledPeriod(client.id, period);
    if (!filed) return false;
  }
  return true;
}

// ---------- Reminder dates calculate karna ----------

const DAILY_TIMES = [
  { hours: 10, minutes: 0 }, // 10am
  { hours: 14, minutes: 0 }, // 2pm
  { hours: 22, minutes: 0 }, // 10pm
];

function atTime(date, hours, minutes) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function isSunOrThu(date) {
  const day = date.getDay(); // 0 = Sunday, 4 = Thursday
  return day === 0 || day === 4;
}

function getTimesForDay(date) {
  return DAILY_TIMES.map((t) => atTime(date, t.hours, t.minutes));
}

// July + August: Sunday & Thursday, 3 baar/din
// Sep 24-30 (last week): daily, 3 baar/din
function getIncomeTaxReminderDates(year) {
  const dates = [];

  for (const month of [6, 7]) {
    // 6 = July, 7 = August
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      if (isSunOrThu(d)) dates.push(...getTimesForDay(d));
    }
  }

  for (let day = 24; day <= 30; day++) {
    dates.push(...getTimesForDay(new Date(year, 8, day))); // 8 = September
  }

  return dates;
}

// 1st: always, 3 baar. Beech ka hissa: Sunday/Thursday, 3 baar. Last 3 din: daily, 3 baar.
function getSalesTaxReminderDates(year, month) {
  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastThreeStart = daysInMonth - 2;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    if (day === 1) dates.push(...getTimesForDay(d));
    else if (day >= lastThreeStart) dates.push(...getTimesForDay(d));
    else if (isSunOrThu(d)) dates.push(...getTimesForDay(d));
  }

  return dates;
}

// ---------- Channel ----------

async function ensureTaxChannel() {
  return notifee.createChannel({
    id: "tax-reminders",
    name: "Tax Filing Reminders",
    importance: AndroidImportance.HIGH,
  });
}

// ---------- Purane scheduled notifications cancel karna ----------

async function cancelNotificationsWithPrefix(prefix) {
  const ids = await notifee.getTriggerNotificationIds();
  const matching = ids.filter((id) => id.startsWith(prefix));
  for (const id of matching) {
    await notifee.cancelTriggerNotification(id);
  }
}

// ---------- MAIN: Income Tax ----------

export async function scheduleIncomeTaxReminders() {
  const now = new Date();
  const year = now.getFullYear();
  const period = getCurrentIncomeTaxPeriod(now);
  const prefix = `tax-income-${period}-`;

  const seasonStart = new Date(year, 6, 1); // July 1
  const seasonEnd = new Date(year, 8, 30, 23, 59, 59); // Sep 30 end

  if (now < seasonStart || now > seasonEnd) {
    await cancelNotificationsWithPrefix(prefix);
    return;
  }

  const allFiled = await areAllClientsFiled("Income Tax", period);
  if (allFiled) {
    await cancelNotificationsWithPrefix(prefix);
    return;
  }

  await ensureTaxChannel();

  const reminderDates = getIncomeTaxReminderDates(year);
  for (const d of reminderDates) {
    if (d.getTime() <= now.getTime()) continue;
    const id = `${prefix}${d.toISOString()}`;

    await notifee.createTriggerNotification(
      {
        id,
        title: "Income Tax Filing Pending",
        body: "Kuch income tax clients ki filing abhi tak mark nahi hui — check kar lein",
        android: { channelId: "tax-reminders", pressAction: { id: "default" } },
      },
      { type: TriggerType.TIMESTAMP, timestamp: d.getTime() },
    );
  }
}

// ---------- MAIN: Sales Tax ----------

export async function scheduleSalesTaxReminders() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const period = getCurrentSalesTaxPeriod(now);
  const prefix = `tax-sales-${period}-`;

  const allFiled = await areAllClientsFiled("Sales Tax", period);
  if (allFiled) {
    await cancelNotificationsWithPrefix(prefix);
    return;
  }

  await ensureTaxChannel();

  const reminderDates = getSalesTaxReminderDates(year, month);
  for (const d of reminderDates) {
    if (d.getTime() <= now.getTime()) continue;
    const id = `${prefix}${d.toISOString()}`;

    await notifee.createTriggerNotification(
      {
        id,
        title: "Sales Tax Filing Pending",
        body: "Kuch sales tax clients ki filing abhi tak mark nahi hui — check kar lein",
        android: { channelId: "tax-reminders", pressAction: { id: "default" } },
      },
      { type: TriggerType.TIMESTAMP, timestamp: d.getTime() },
    );
  }
}

export async function scheduleAllTaxReminders() {
  await scheduleIncomeTaxReminders();
  await scheduleSalesTaxReminders();
}
