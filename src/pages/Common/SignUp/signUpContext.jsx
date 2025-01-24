import React, { createContext, useContext, useReducer } from "react";

const initialSignUpData = {
  email: "",
  firstName: "",
  lastName: "",
  dob: "",
  password: "",
  role: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_ROLE":
      return { ...state, role: action.payload };
    default:
      return state;
  }
};

//  create context here
const signUpContext = createContext({});

// wrap this component around App.tsx to get access to userData in all components
const SignUpContextProvider = ({ children }) => {
  const [signUpData, dispatch] = useReducer(reducer, initialSignUpData);

  return <signUpContext.Provider value={{ signUpData, dispatch }}>{children}</signUpContext.Provider>;
};

// use this custom hook to get the data in any component in component tree
const useSignUpContext = () => useContext(signUpContext);
export { useSignUpContext, SignUpContextProvider };
