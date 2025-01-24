import React, { createContext, useContext, useReducer } from "react";

const initialBookingData = {
  from: "",
  to: "",
  selectedDate: "",
  num_guests: 0,
};


// localStorage.setItem("booking_details", JSON.stringify(initialBookingData));

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_BOOKING_DETAILS":
      localStorage.setItem("booking_details", JSON.stringify(action.payload));
      localStorage.setItem("booking_id", action.payload.id);
      return { ...state, ...action.payload };
    case "SET_BOOKING_ID":
      return { ...state, id: action.payload };
    default:
      return state;
  }
};

//  create context here
const bookingContext = createContext({});

// wrap this component around App.tsx to get access to userData in all components
const BookingContextProvider = ({ children }) => {
  const [bookingData, dispatch] = useReducer(reducer, initialBookingData);

  return <bookingContext.Provider value={{ bookingData, dispatch }}>{children}</bookingContext.Provider>;
};

// use this custom hook to get the data in any component in component tree
const useBookingContext = () => useContext(bookingContext);

export { useBookingContext, BookingContextProvider };
