import { AuthContext } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import React from "react";
import { useMemo } from "react";
import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoIcon from "./icons/LogoIcon";

const Footer = () => {
  const { state: authState, dispatch: authDispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const navigate = useNavigate();

  const { pathname } = useLocation();

  const blackList = useMemo(() => ["/admin", "/login", "/account/messages", "/signup"], []);

  function switchToHost() {
    authDispatch({ type: "SWITCH_TO_HOST" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a host`,
        btn: "Ok got it",
      },
    });
  }

  function switchToCustomer() {
    authDispatch({ type: "SWITCH_TO_CUSTOMER" });
    globalDispatch({
      type: "SHOW_CONFIRMATION",
      payload: {
        heading: "Success",
        message: `You are now signed in as a customer`,
        btn: "Ok got it",
      },
    });
  }

  function switchToHostOrCustomer() {
    if (authState.role == "host") {
      switchToCustomer();
    } else {
      switchToHost();
    }
    navigate("/");
  }

  if (blackList.some((path) => pathname.startsWith(path))) return null;

  return (
    <div className="bg-white">
      <div className="header-light pb-10">
        <div className="container mx-auto px-4 py-[24px] text-white 2xl:px-16">
          <div className="mb-[17px] hidden justify-between md:flex">
            <Link to="/">
              <LogoIcon />
            </Link>
            <div className="flex gap-[24px]">
              {(authState.role == "host" || authState.role == "customer") && (
                <>
                  {authState.originalRole != "customer" ? (
                    <button
                      className="duration-200 hover:underline"
                      onClick={switchToHostOrCustomer}
                    >
                      Join as {authState.role == "host" ? "customer" : "host"}
                    </button>
                  ) : (
                    <Link
                      className="duration-200 hover:underline"
                      to="/become-a-host"
                    >
                      Host Your Space
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex w-72 gap-[24px] pl-2">
              <Link
                className="duration-200 hover:underline"
                to="/faq"
              >
                FAQs
              </Link>
              <Link
                className="duration-200 hover:underline"
                to="/contact-us"
              >
                Contact us
              </Link>
            </div>
          </div>
          <div className="mb-[17px] flex justify-between text-xs md:text-sm">
            <div className="flex gap-[24px]">
              <span>ergo © All rights reserved</span>
            </div>
            <div className="flex gap-[24px]">
              <Link
                className="duration-200 hover:underline"
                to="/help/terms_and_conditions"
              >
                Terms and conditions
              </Link>
              <Link
                className="duration-200 hover:underline"
                to="/help/privacy-policy"
              >
                Privacy and policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
