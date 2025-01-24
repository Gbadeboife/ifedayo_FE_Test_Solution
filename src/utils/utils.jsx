let timerId;
import DOMPurify from "dompurify";
import sanitizeHtml from 'sanitize-html';

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const getNonNullValue = (value) => {
  if (value != "") {
    return value;
  } else {
    return undefined;
  }
};

export function filterEmptyFields(object) {
  Object.keys(object).forEach((key) => {
    if (empty(object[key])) {
      delete object[key];
    }
  });
  return object;
}

export function empty(value) {
  return value === "" || value === null || value === undefined || value === "undefined";
}

export const debounce = (fn, delay = 500) => {
  if (timerId) {
    return;
  }
  timerId = setTimeout(() => {
    fn();
    timerId = undefined;
  }, delay);
};

export const addHours = (numOfHours, date) => {
  let dateToMilliseconds = date.getTime();
  let addedHours = dateToMilliseconds + 60 * 60 * 1000 * numOfHours;
  return new Date(addedHours);
};

export const secondsToHour = (d) => {
  d = Number(d);
  let h = Math.floor(d / 3600);

  let hDisplay = h > 0 ? h + (h == 1 ? " hr" : " hrs") : "";
  return hDisplay;
};

export function parseSearchParams(params) {
  let obj = {};
  [...params].forEach(([k, v]) => {
    if (typeof v === "string") {
      obj[k] = v || undefined;
    } else {
      obj[k] = v;
    }
  });
  return obj;
}

export function clearSearchParams(params, setParams) {
  [...params].forEach(([k, v]) => {
    params.delete(k);
  });
  setParams(params);
}

export function isNotInViewport(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return true;
  const rect = element.getBoundingClientRect();
  return !(
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function parseJsonSafely(json, failReturn) {
  if (typeof json === "object" || Array.isArray(json)) return json;
  if (typeof json !== "string") return failReturn;
  try {
    const res = JSON.parse(json);
    return res;
  } catch (err) {
    console.log("err", json, err);
    return failReturn;
  }
}

export function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function isValidDate(dateStr) {
  if (!dateStr) return false;
  let d = new Date(dateStr);
  return !isNaN(d);
}

export const sanitizeAndTruncate = (html, maxLength) => {
  // Sanitize the HTML content
  const sanitizedHtml = DOMPurify.sanitize(html);

  // Truncate the content
  const truncatedHtml = sanitizedHtml.substring(0, maxLength);

  // Render the truncated content with ellipsis
  const truncatedWithEllipsis = truncatedHtml + (sanitizedHtml.length > maxLength ? '...' : '');

  return truncatedWithEllipsis;
};

export const increaseDate = (newDate) => {

  let initialDate = new Date(newDate);

  // Increase the date by one day
  initialDate.setDate(initialDate.getDate() + 1);

  // Convert the increased date back to a string
  let increasedDate = initialDate.toISOString().split('T')[0];

  return increasedDate;
}
export const formatDate = (newDate) => {

  // Original date string
  let originalDateString = newDate;

  // Create a Date object from the original date string
  const originalDate = new Date(originalDateString);

  // Extract year, month, and day from the Date object
  const year = originalDate.getFullYear();
  // Months in JavaScript are 0-based, so add 1 to get the correct month
  const month = originalDate.getMonth() + 1;
  const day = originalDate.getDate();

  // Create the desired formatted date string
  const formattedDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  return formattedDateString;
}
export const formatDate2 = (newDate) => {

  // Original date string
  let originalDateString = newDate;

  // Create a Date object from the original date string
  const originalDate = new Date(originalDateString);

  // Extract year, month, and day from the Date object
  const year = originalDate.getFullYear();
  // Months in JavaScript are 0-based, so add 1 to get the correct month
  const month = originalDate.getMonth() + 1;
  const day = originalDate.getDate();

  // Create the desired formatted date string
  const formattedDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  return formattedDateString;
}

export const notificationTime = (_date) => {
  const isoDateTime = _date;

  // Create a Date object from the ISO string
  const date = new Date(isoDateTime);

  date?.setHours(date?.getHours() - 1);

  // Format the date in the desired format
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  return formattedDate;
}
export const addOneHour = (_date) => {

  // Parse the input time string into a Date object
  const inputDate = new Date(_date);

  // Add one hour to the Date object
  inputDate.setHours(inputDate.getHours() + 1);

  // Format the result as a string in the desired format
  const formattedDate = `${inputDate.getFullYear()}-${(inputDate.getMonth() + 1).toString().padStart(2, '0')}-${inputDate.getDate().toString().padStart(2, '0')} ${inputDate.getHours().toString().padStart(2, '0')}:${inputDate.getMinutes().toString().padStart(2, '0')}:${inputDate.getSeconds().toString().padStart(2, '0')}`;

  return formattedDate;
}
export const formatScheduleDate = (_date) => {
  const originalDate = new Date(_date);

  const year = originalDate.getFullYear().toString().slice(-2); // Get the last two digits of the year
  const month = (originalDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based, so add 1
  const day = originalDate.getDate().toString().padStart(2, '0');

  const formattedDate = `${month}/${day}/${year}`;

  return formattedDate;
}

export function extractLocationInfo(input) {
  // Define regular expressions to match the patterns
  const cityStateRegex = /(.+),\s*(.+),\s*(.+)/; // Matches "City, State, Country"
  const cityCountryRegex = /(.+),\s*(.+)/; // Matches "City, Country"

  // Try to match the input against both regex patterns
  const cityStateMatch = input.match(cityStateRegex);
  const cityCountryMatch = input.match(cityCountryRegex);

  if (cityStateMatch) {
    // Extracted as "City, State" and "Country"
    const cityState = cityStateMatch[1];
    const country = cityStateMatch[3];
    return [cityState, country];
  } else if (cityCountryMatch) {
    // Extracted as "City" and "Country"
    const city = cityCountryMatch[1];
    const country = cityCountryMatch[2];
    return [city, country];
  } else {
    // No match found
    return [input];
  }
}
