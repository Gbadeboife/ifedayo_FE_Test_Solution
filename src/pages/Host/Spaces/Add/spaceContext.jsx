import moment from "moment";
import React, { createContext, useContext, useReducer } from "react";

const initialSpaceData = {
  category: "",
  name: "",
  rate: "",
  max_capacity: 0,
  description: "",
  rule: "",
  zip: "",
  country: "",
  city: "",
  address_line_1: "",
  address_line_2: "",
  additional_guest_rate: "",
  size: 0,
  pictures: [null, null, null, null, null, null],
  pictureIds: [],
  faqs: [{ question: "", answer: "" }],
  thumbnail: "",
  addons: [],
  amenities: [],
  customSlots: {},
  schedule_template: {}
};

function lastWeek(today) {
  return moment(today).subtract(1, "week").format("MM/DD/YY");
}

function addWeekToDate(slots) {
  if (!Array.isArray(slots)) return [];
  return slots.map((slot) => ({ start: moment(slot.start).add(1, "week").toISOString(), end: moment(slot.end).add(1, "week").toISOString() }));
}

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PROPERTY_ID":
      return { ...state, property_id: action.payload };
    case "SET_DETAILS_ONE":
      return { ...state, ...action.payload };
    case "SET_DETAILS_TWO":
      return { ...state, ...action.payload };
    case "SET_THUMBNAIL":
      return { ...state, thumbnail: action.payload };
    case "SET_DAY_SLOT":
      return { ...state, customSlots: { ...state.customSlots, [action.payload.day]: action.payload.slots } };
    case "CLEAR_ALL_SLOTS":
      return { ...state, customSlots: {} };
    case "CLEAR_DAY_SLOT":
      return { ...state, customSlots: { ...state.customSlots, [action.payload]: undefined } };
    case "INHERIT_DAY_SLOT":
      return { ...state, customSlots: { ...state.customSlots, [action.payload]: addWeekToDate(state.customSlots[lastWeek(action.payload)]) } };
    case "SET_SCHEDULE_TEMPLATE":
      return { ...state, schedule_template: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_PROPERTY_NAME":
      return { ...state, name: action.payload };
    case "SET_AMENITIES":
      return { ...state, amenities: action.payload };
    case "SET_ADDONS":
      return { ...state, addons: action.payload };
    case "SET_RULE":
      return { ...state, rule: action.payload };
    default:
      return state;
  }
};

//  create context here
const spaceContext = createContext({});

// wrap this component around App.tsx to get access to userData in all components
const SpaceContextProvider = ({ children }) => {
  const [spaceData, dispatch] = useReducer(reducer, initialSpaceData);

  return <spaceContext.Provider value={{ spaceData, dispatch }}>{children}</spaceContext.Provider>;
};

// use this custom hook to get the data in any component in component tree
const useSpaceContext = () => useContext(spaceContext);
export { useSpaceContext, SpaceContextProvider };
