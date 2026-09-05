import moment from "moment";
export const FormatDate = (timestamp) => {
  return new Date(timestamp);
};
export const formatDateForText = (date) => {
  let jsDate = date;

  // Firestore Timestamp object (real ya serialized) handle karo
  if (date && typeof date === "object" && date?.seconds !== undefined) {
    jsDate = new Date(date.seconds * 1000);
  }

  return moment(jsDate).format("L");
};
export const getDatesRange = (lastDate, nextDate) => {
  const last = moment(new Date(lastDate), "MM/DD/YYYY");
  const next = moment(new Date(nextDate), "MM/DD/YYYY");
  const dates = [];

  while (last.isSameOrBefore(next)) {
    dates.push(last.format("MM/DD/YYYY"));
    last.add(1, "days");
  }
  return dates;
};

export const GetDateRangeToDisplay = () => {
  const dateList = [];
  for (let i = 0; i <= 7; i++) {
    dateList.push({
      date: moment().add(i, "days").format("DD"),
      day: moment().add(i, "days").format("dd"),
      formatedDate: moment().add(i, "days").format("L"),
    });
  }
  return dateList;
};
