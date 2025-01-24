import React, { useReducer, useState } from "react";
import MkdSDK from "@/utils/MkdSDK";

export const AuthContext = React.createContext({ state: {} });

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  role: null,
  originalRole: null,
  sessionExpired: false,
  allowCheckVerification: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      localStorage.setItem("user", Number(action.payload.user_id));
      localStorage.setItem("token", action.payload.token ?? action.payload.access_token);
      localStorage.setItem("role", action.payload.role);
      localStorage.setItem("originalRole", ((action.payload.originalRole === undefined) || action.payload.originalRole === "undefined") ? "customer" : action.payload.originalRole);
      return {
        ...state,
        isAuthenticated: true,
        user: Number(localStorage.getItem("user")),
        token: localStorage.getItem("token"),
        role: localStorage.getItem("role"),
        originalRole: localStorage.getItem("originalRole"),
      };
    case "LOGOUT":
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        sessionExpired: false,
        role: null,
        originalRole: null,
      };
    case "SESSION_EXPIRED":
      return {
        ...state,
        sessionExpired: true,
      };
    case "SWITCH_TO_HOST":
      localStorage.setItem("role", "host");
      return {
        ...state,
        role: "host",
      };
    case "SWITCH_TO_CUSTOMER":
      localStorage.setItem("role", "customer");
      return {
        ...state,
        role: "customer",
      };
    case "SWITCH_TO_ADMIN":
      localStorage.setItem("role", "admin");
      return {
        ...state,
        role: "admin",
      };
    case "ALLOW_CHECK_VERIFICATION":
      return {
        ...state,
        allowCheckVerification: true,
      };
    case "DISALLOW_CHECK_VERIFICATION":
      return {
        ...state,
        allowCheckVerification: false,
      };
    default:
      return state;
  }
};

let sdk = new MkdSDK();

export const tokenExpireError = (dispatch, errorMessage) => {
  /**
   * either this or we pass the role as a parameter
   */
  const role = localStorage.getItem("role");
  if (errorMessage === "TOKEN_EXPIRED") {
    dispatch({ type: "SESSION_EXPIRED" });
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const originalRole = localStorage.getItem("originalRole");

    if (!token) {
      setLoading(false);
      return;
    }
    (async function () {
      setLoading(true);
      try {
        await sdk.check(originalRole);
        dispatch({
          type: "LOGIN",
          payload: {
            user_id: user,
            token,
            role: role,
            originalRole: originalRole,
          },
        });
      } catch (error) {
        if (role) {
          dispatch({
            type: "LOGOUT",
          });
          window.location.href = "/" + role + "/login";
        } else {
          dispatch({
            type: "LOGOUT",
          });
          window.location.href = "/";
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="popup-container flex items-center justify-center">
    <div className="">
      <svg
        style={{ margin: "auto", background: "transparent", display: " block", shapeRendering: "auto" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
        className="md:w-[100px] md:h-[100px] w-[80px] h-[80px]"
      >
        <path
          fill="none"
          stroke="#d0d5dd"
          strokeWidth="6"
          strokeDasharray="42.76482137044271 42.76482137044271"
          d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
          strokeLinecap="round"
          style={{ transform: "scale(0.8)", transformOrigin: "50px 50px" }}
        >
          <animate
            attributeName="stroke-dashoffset"
            repeatCount="indefinite"
            dur="1.882051282051282s"
            keyTimes="0;1"
            values="0;256.58892822265625"
          ></animate>
        </path>
      </svg>
    </div>
  </div>;

  return (
    <AuthContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
