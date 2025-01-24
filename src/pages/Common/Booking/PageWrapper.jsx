import React from "react";
import { Outlet } from "react-router";
import { BookingContextProvider } from "./bookingContext";

const PageWrapper = () => {
  return (
    <BookingContextProvider>
      <div className="bg-white">
        <Outlet />
      </div>
    </BookingContextProvider>
  );
};
export default PageWrapper;
