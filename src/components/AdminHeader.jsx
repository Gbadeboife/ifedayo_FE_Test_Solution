import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import { useEffect } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { NOTIFICATION_STATUS } from "@/utils/constants";
import { AuthContext, tokenExpireError } from "@/authContext";
import { useContext } from "react";
import adminNavigationItems from "@/utils/adminNavigationItems";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ArrowLeftOnRectangleIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import LogoIcon from "./Icons/LogoIcon";

export const AdminHeader = () => {
  const { state, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { dispatch, state: authState } = useContext(AuthContext);
  const navigate = useNavigate();

  async function fetchNotificationCount() {
    const sdk = new MkdSDK();
    sdk.setTable("notification");

    try {
      const result = await sdk.callRestAPI({ payload: { status: NOTIFICATION_STATUS.NOT_ADDRESSED } }, "GETALL");
      const g = result?.list?.filter((not) => Number(not?.status) == 0)

      globalDispatch({ type: "SET_NOTIFICATION_COUNT", payload: g.length });
    } catch (err) {
      showToast(globalDispatch, err.message);
      tokenExpireError(dispatch, err.message);
    }
  }

  function switchToHost() {
    dispatch({ type: "SWITCH_TO_HOST" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a host`,
        btn: "Ok got it",
      },
    });
    navigate("/");
  }

  function switchToCustomer() {
    dispatch({ type: "SWITCH_TO_CUSTOMER" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a customer`,
        btn: "Ok got it",
      },
    });
    navigate("/");
  }

  useEffect(() => {
    let interval = setInterval(() => {
      fetchNotificationCount();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={`sidebar-holder overflow-y-auto border-r-4 border-gray-100 ${!state.isOpen ? "open-nav" : ""}`}>
        <div className="sticky top-0 h-fit pb-8">
          <div className="mt-4 w-full p-4">
            <div className="mx-auto w-10/12 text-center text-2xl font-bold text-black">
              <LogoIcon fill={"#1D2939"} />
            </div>
          </div>

          <div className="sidebar-list w-full">
            <ul className="flex flex-wrap">
              {adminNavigationItems.map((item) => {
                if (item.sub_categories) {
                  return (
                    <li
                      key={item.path}
                      style={{ display: "relative" }}
                      className={`super-nav relative mx-auto my-auto block w-10/12 list-none justify-between rounded-lg  ${item.sub_categories.length > 7 ? "larger" : ""} ${item.sub_categories.length > 2 ? "large" : ""}  ${item.sub_categories.length < 2 ? "small" : ""
                        }`}
                      onClick={(e) => e.currentTarget.classList.toggle("open")}
                    >
                      <NavLink
                        to={`/admin/${item.path}`}
                        className={`flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white ${state.path == item.path ? "bg-[#1D2939] stroke-white text-white" : ""}`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span>{item.title}</span>
                        <span className="flex flex-grow justify-end">
                          <ChevronDownIcon className="h-4 w-4" />
                        </span>
                      </NavLink>
                      <div className="nav-item-dropdown absolute w-full">
                        {item.sub_categories.map((sub, idx) => (
                          <div
                            key={idx}
                            className={`group mx-auto my-auto block w-10/12 list-none justify-between truncate rounded-lg`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <NavLink
                              to={`/admin/${sub.path}`}
                              className={`flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white ${state.path == sub.path ? "bg-[#1D2939] stroke-white text-white" : ""}`}
                            >
                              <span className="mr-3">{sub.icon}</span>
                              <span>{sub.title}</span>
                            </NavLink>
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                }

                if (item.path == "notification") {
                  return (
                    <li
                      key={item.path}
                      className={`group relative mx-auto my-auto block w-10/12 list-none justify-between rounded-lg`}
                    >
                      <NavLink
                        to={`/admin/${item.path}`}
                        className={`flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white ${state.path == item.path ? "bg-[#1D2939] stroke-white text-white" : ""}`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        <strong
                          className={`${state.adminNotificationCount > 0 ? "inline" : "hidden"
                            } absolute right-1 flex h-8 w-8 items-center justify-center rounded-full border bg-red-400 px-2 text-xs text-white`}
                        >
                          {state.adminNotificationCount}
                        </strong>
                        <span>{item.title}</span>
                      </NavLink>
                    </li>
                  );
                }

                return (
                  <li
                    key={item.path}
                    className={`group mx-auto my-auto block w-10/12 list-none justify-between rounded-lg`}
                  >
                    <NavLink
                      to={`/admin/${item.path}`}
                      className={`flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white ${state.path == item.path ? "bg-[#1D2939] stroke-white text-white" : ""}`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </NavLink>
                  </li>
                );
              })}
              <li className="group group mx-auto w-10/12 !cursor-pointer list-none rounded-lg">
                <a
                  className="flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white"
                  onClick={() => {
                    globalDispatch({
                      type: "SHOWMODAL",
                      payload: {
                        showModal: true,
                        modalShowTitle: "Are you sure?",
                        modalShowMessage: "You are about to log out.",
                        modalBtnText: "Yes, Log Out",
                      },
                    });
                  }}
                >
                  <span className="mr-3">{<ArrowLeftOnRectangleIcon className="h-6 w-6" />}</span>
                  <span>Logout</span>
                </a>
              </li>
              <li className="group group mx-auto w-10/12 !cursor-pointer list-none rounded-lg">
                <a
                  className="flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white"
                  onClick={switchToCustomer}
                >
                  <span className="mr-3">
                    <ArrowsRightLeftIcon className="h-6 w-6" />
                  </span>
                  <span>Switch to customer</span>
                </a>
              </li>
              <li className="group group mx-auto w-10/12 !cursor-pointer list-none rounded-lg">
                <a
                  className="flex items-center rounded-lg group-hover:bg-[#1D2939] group-hover:text-white"
                  onClick={switchToHost}
                >
                  <span className="mr-3">
                    <ArrowsRightLeftIcon className="h-6 w-6" />
                  </span>
                  <span>Switch to Host</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminHeader;
