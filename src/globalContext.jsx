import React, { useReducer } from "react";
export const GlobalContext = React.createContext({});

const initialState = {
  globalMessage: "",
  globalMessageType: "",
  isOpen: true,
  show: false,
  path: "",
  location: "",
  saveChanges: false,
  deleted: false,
  loading: false,
  error: false,
  errorHeading: "",
  errorMsg: "",
  confirmation: false,
  confirmationHeading: "",
  confirmationMsg: "",
  confirmationCloseFn: undefined,
  adminNotificationCount: 0,
  unreadMessages: 0,
  isLocationSet: false,
  userLocationData: {},
  user: {},
  spaceCategories: [],
  notVerifiedModal: false,
  menuIconOpen: false,
  addPaymentMethodModal: false,
  addPayoutMethodModal: false,
  tourOpen: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SNACKBAR":
      return {
        ...state,
        globalMessage: action.payload.message,
        globalMessageType: action.payload.type,
      };
    case "SETPATH":
      return {
        ...state,
        path: action.payload.path,
      };
    case "SETLOCATION":
      let data = action.payload.location;
      if (action.payload.location.includes("undefined")) {
        const parts = action.payload.location.split(",");
        const result = parts[0].trim();
        data = result;
      }
      return {
        ...state,
        location: data,
      };
    case "OPEN_SIDEBAR":
      return {
        ...state,
        isOpen: action.payload.isOpen,
      };
    case "SHOWMODAL":
      return {
        ...state,
        showModal: action.payload.showModal,
        modalShowMessage: action.payload.modalShowMessage,
        modalBtnText: action.payload.modalBtnText,
        modalShowTitle: action.payload.modalShowTitle,
        type: action.payload.type,
        itemId: action.payload.itemId,
        itemId2: action.payload.itemId2,
        table1: action.payload.table1,
        table2: action.payload.table2,
        backTo: action.payload.backTo,
      };

    case "SAVE_CHANGES":
      return {
        ...state,
        saveChanges: action.payload.saveChanges,
      };

    case "DELETED":
      return {
        ...state,
        deleted: action.payload.deleted,
      };

    case "SHOW_REVIEW":
      return {
        ...state,
        review: action.payload.review,
        showReview: action.payload.showReview,
      };
    case "START_LOADING":
      return {
        ...state,
        loading: true,
      };
    case "STOP_LOADING":
      return {
        ...state,
        loading: false,
      };

    case "SHOW_ERROR":
      if (action.payload.message == "TOKEN_EXPIRED") {
        const role = localStorage.getItem("role") ?? "customer";
        localStorage.clear();
        location.href = "/" + role + "/login";
        return state;
      }
      return {
        ...state,
        error: true,
        errorHeading: action.payload.heading,
        errorMsg: action.payload.message,
      };
    case "CLOSE_ERROR":
      return {
        ...state,
        error: false,
        errorHeading: "",
        errorMsg: "",
      };

    case "SHOW_CONFIRMATION":
      return {
        ...state,
        confirmation: true,
        confirmationHeading: action.payload.heading,
        confirmationMsg: action.payload.message,
        confirmationBtn: action.payload.btn,
        confirmationCloseFn: action.payload.onClose,
      };
    case "CLOSE_CONFIRMATION":
      return {
        ...state,
        confirmation: false,
        confirmationHeading: "",
        confirmationMsg: "",
        confirmationBtn: "",
        confirmationCloseFn: undefined,
      };
    case "SET_NOTIFICATION_COUNT":
      return {
        ...state,
        adminNotificationCount: action.payload,
      };
    case "SET_USER_CURRENT_LOCATION":
      return {
        ...state,
        isLocationSet: true,
        userLocationData: action.payload,
      };
    case "SET_UNREAD_MESSAGES_COUNT":
      return {
        ...state,
        unreadMessages: action.payload,
      };
    case "SET_USER_DATA":
      return {
        ...state,
        user: action.payload,
      };
    case "CLEAR_USER_DATA":
      return {
        ...state,
        user: {},
      };
    case "SET_SPACE_CATEGORIES":
      return {
        ...state,
        spaceCategories: action.payload,
      };
    case "OPEN_NOT_VERIFIED_MODAL":
      return {
        ...state,
        notVerifiedModal: true,
      };
    case "CLOSE_NOT_VERIFIED_MODAL":
      return {
        ...state,
        notVerifiedModal: false,
      };
    case "OPEN_MENU_ICON":
      return {
        ...state,
        menuIconOpen: true,
      };
    case "CLOSE_MENU_ICON":
      return {
        ...state,
        menuIconOpen: false,
      };
    case "OPEN_ADD_PAYMENT_METHOD":
      return {
        ...state,
        addPaymentMethodModal: true,
      };
    case "CLOSE_ADD_PAYMENT_METHOD":
      return {
        ...state,
        addPaymentMethodModal: false,
      };
    case "START_TOUR":
      return {
        ...state,
        tourOpen: true,
      };
    case "END_TOUR":
      return {
        ...state,
        tourOpen: false,
      };
    default:
      return state;
  }
};

export const showToast = (dispatch, message, timeout = 3000, type) => {
  dispatch({
    type: "SNACKBAR",
    payload: {
      type,
      message,
    },
  });

  setTimeout(() => {
    dispatch({
      type: "SNACKBAR",
      payload: {
        type: "",
        message: "",
      },
    });
  }, timeout);
};

const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // React.useEffect(() => {

  // }, []);

  return (
    <GlobalContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
