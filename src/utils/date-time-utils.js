import moment from "moment";

function addHours(numOfHours, date) {
  let dateToMilliseconds = date.getTime();
  let addedHours = dateToMilliseconds + 60 * 60 * 1000 * numOfHours;
  return new Date(addedHours);
}

function secondsToHour(d) {
  d = Number(d);
  let h = Math.floor(d / 3600);

  let hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
  return hDisplay;
}

// formatAMPM takes date: String | Date and returns time in AM/PM format e.g 12:00am
function formatAMPM(date) {
  date = new Date(date);
  if (isNaN(date)) return "";

  var hours = date.getHours();
  var minutes = date.getMinutes();
  var am_pm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = (hours < 10 ? "0" + hours : hours) + ":" + minutes + " " + am_pm;
  return strTime;
}

// getDuration can take as arguments (am/pm, date, valid date string) and returns hrs in Number
function getDuration(start, end) {
  var start_date = new Date(start);
  var end_date = new Date(end);

  if (!isNaN(start_date) && !isNaN(end_date)) {
    return (end_date - start_date) / 3600000;
  }

  start_date = new Date(`01/01/2001 ${start}`);
  end_date = new Date(`01/01/2001 ${end}`);

  if (!isNaN(start_date) && !isNaN(end_date)) {
    return (end_date - start_date) / 3600000;
  }
  return 0;
}

const fullDaysMapping = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthsMapping = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fullMonthsMapping = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysMapping = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const hourlySlots = [
  "12:00 am",
  "01:00 am",
  "02:00 am",
  "03:00 am",
  "04:00 am",
  "05:00 am",
  "06:00 am",
  "07:00 am",
  "08:00 am",
  "09:00 am",
  "10:00 am",
  "11:00 am",
  "12:00 pm",
  "01:00 pm",
  "02:00 pm",
  "03:00 pm",
  "04:00 pm",
  "05:00 pm",
  "06:00 pm",
  "07:00 pm",
  "08:00 pm",
  "09:00 pm",
  "10:00 pm",
  "11:00 pm",
];

function formatDate(date) {
  if (date == null) return "";
  date = new Date(date);
  if (isNaN(date)) return "";
  return monthsMapping[date.getMonth()] + " " + date.getDate() + "/" + date.getFullYear();
}

function isSameDay(date1, date2) {
  return moment(date1).format("MM/DD/YY") == moment(date2).format("MM/DD/YY");
}

function formatDiff(target) {
  // if diff > 60seconds return min
  const seconds = moment.duration(moment(target).diff(moment())).asSeconds();
  const minutes = moment.duration(moment(target).diff(moment())).asMinutes();
  const hours = moment.duration(moment(target).diff(moment())).asHours();
  const days = moment.duration(moment(target).diff(moment())).asDays();

  if (days > 30) {
    return { timeLeft: Math.floor(moment.duration(moment(target).diff(moment())).asMonths()), format: "mon" };
  }
  if (hours > 24) {
    return { timeLeft: Math.floor(days), format: Math.floor(days) > 1 ? "days" : "day" };
  }
  if (minutes > 60) {
    return { timeLeft: Math.floor(hours), format: Math.floor(hours) > 1 ? "hrs" : "hr" };
  }
  if (seconds > 60) {
    return { timeLeft: Math.floor(minutes), format: Math.floor(minutes) > 1 ? "mins" : "min" };
  }
  return {};
}

export { formatAMPM, getDuration, formatDate, isSameDay, secondsToHour, formatDiff, fullDaysMapping, fullMonthsMapping, daysMapping, monthsMapping, hourlySlots };
