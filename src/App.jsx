import React, { useContext, useEffect, useState } from "react";
import AuthProvider, { AuthContext } from "./authContext";
import GlobalProvider, { GlobalContext } from "./globalContext";
import Main from "./main";
import { BrowserRouter as Router } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "react-loading-skeleton/dist/skeleton.css";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';

const stripePromise = loadStripe(import.meta.env.VITE_REACT_STRIPE_PUBLIC_KEY);


function App() {

  return (
    <MantineProvider
      theme={{
        primaryColor: "violet"
      }}
    >
      <Notifications position="top-right" />
      <AuthProvider>
        <GlobalProvider>
          <Router>
            <Elements stripe={stripePromise}>
              <Main />
            </Elements>
          </Router>
        </GlobalProvider>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
