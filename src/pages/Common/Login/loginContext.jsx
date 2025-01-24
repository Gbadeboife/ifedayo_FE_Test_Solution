import React, { createContext, useContext, useReducer } from "react";

const initialLoginData = {
  email: "",
  password: "",
  forgetPasswordEmail: "",
  reset_token: ""
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_DATA":
      return { ...state, email: action.payload.email, password: action.payload.password };
    default:
      return state;
  }
};

//  create context here
const loginContext = createContext({});

// wrap this component around App.tsx to get access to userData in all components
const LoginContextProvider = ({ children }) => {
  const [loginData, dispatch] = useReducer(reducer, initialLoginData);

  return <loginContext.Provider value={{ loginData, dispatch }}>{children}</loginContext.Provider>;
};

// use this custom hook to get the data in any component in component tree
const useLoginContext = () => useContext(loginContext);
export { useLoginContext, LoginContextProvider };
