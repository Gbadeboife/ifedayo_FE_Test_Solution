import { GlobalContext, showToast } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import MkdSDK from "@/utils/MkdSDK";
import { sleep } from "@/utils/utils";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { AuthContext, tokenExpireError } from "../authContext";
import LogoIcon from "./frontend/icons/LogoIcon";
import NavMenu from "./frontend/NavMenu";
import StaticSearchBar from "./frontend/StaticSearchBar";

const getNavBarVariant = (path) => {
  if (path.startsWith("/account") || path.startsWith("/property") || path.startsWith("/help")) {
    return "light";
  }
  switch (path) {
    case "/contact-us":
    case "/faq":
      return "white";
    case "/search":
    case "/explore":
    case "/favorites":
    case "/become-a-host":
    case "/reset-password":
      return "light";
    default:
      return "transparent";
  }
};

export const CustomerHeader = () => {
  const { state: authState, dispatch } = React.useContext(AuthContext);
  const { state: globalState, dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [variant, setVariant] = useState(getNavBarVariant(pathname));

  async function fetchProfile() {
    const sdk = new MkdSDK();
    try {
      const result = await sdk.getProfileCustom();
      globalDispatch({ type: "SET_USER_DATA", payload: result });
    } catch (err) {
      showToast(globalDispatch, err.message, 4000, "ERROR");
      tokenExpireError(dispatch, err.message);
    }
  }

  useEffect(() => {
    const onScroll = () => {
      if (pathname == "/") {
        if (window.scrollY > 10) {
          setVariant("white");
        } else {
          setVariant("transparent");
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    fetchProfile();
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    setVariant(getNavBarVariant(pathname));
  }, [pathname]);

  const joinAsHostAdmin = async () => {
    let newLogin = { ...authState, role: "host" };
    globalDispatch({ type: "START_LOADING" });
    await sleep(500);
    globalDispatch({ type: "STOP_LOADING" });
    navigate("/");
    dispatch({ type: "LOGOUT" });
    dispatch({ type: "LOGIN", payload: newLogin });
    showToast(globalDispatch, "Joined as Host", 2000);
  };

  async function becomeAHost() {
    // check if all fields are ready to go
    if (!(globalState.verificationType && globalState.dob && globalState.city && globalState.country && globalState.about)) {
      navigate("/become-a-host");
      return;
    }
    try {
      await callCustomAPI(
        "edit-self",
        "post",
        {
          user: { role: "host" },
        },
        "",
      );
      dispatch({ type: "SWITCH_TO_HOST" });
      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Success",
          message: `You are now signed in as a host`,
          btn: "Ok got it",
        },
      });
    } catch (err) { }
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

  if (pathname.includes("/login") || pathname.includes("/signup")) return null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 z-50 flex w-screen flex-wrap items-center justify-between py-4 px-4 text-sm duration-500 md:flex-nowrap md:rounded-br-[32px] md:rounded-bl-[32px] md:px-12 header-${variant}`}
      >
        <nav className={`gap-6`}>
          <Link
            to="/"
            className=""
          >
            <LogoIcon fill={variant == "transparent" || variant == "light" ? undefined : "#101828"} />
          </Link>
        </nav>
        <StaticSearchBar className="hidden lg:block" />

        <div className="flex gap-4 space-x-4">
        <nav className={`z-50 inline `}>
        {" "}
        {pathname.startsWith("/account") && (
          <button
            className={`self-stretch rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant} ${variant == "transparent" ? "" : "border-white"}`}
            onClick={()=>navigate("/search?location=&booking_start_time=&max_capacity=&capacity=&size=")}
          >
            <span>Explore Spaces</span>
          </button>
        )}
      </nav>

      <nav className="z-50 flex items-center gap-6">
          {authState.originalRole != "customer" ? (
            <button
              onClick={switchToHost}
              className={`self-stretch rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant} hidden whitespace-nowrap md:inline`}
            >
              <span>Join as host</span>
            </button>
          ) : (
            <button
              onClick={becomeAHost}
              className={`self-stretch rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant} hidden whitespace-nowrap md:inline`}
            >
              <span>Become a host</span>
            </button>
          )}

          <NavMenu variant={variant} />
        </nav>

    </div>

        <StaticSearchBar className="flex w-full justify-center py-4 md:hidden" />
      </header>
    </>
  );
};

export default CustomerHeader;
