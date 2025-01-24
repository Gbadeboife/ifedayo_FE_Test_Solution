import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import LogoIcon from "./frontend/icons/LogoIcon";
import ReactTestUtils from "react-dom/test-utils";
import StaticSearchBar from "./frontend/StaticSearchBar";
import NavMenu from "./frontend/NavMenu";
import { GlobalContext, showToast } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext, tokenExpireError } from "@/authContext";

const getNavBarVariant = (path) => {
  if (path.startsWith("/account") || path.startsWith("/property") || path.startsWith("/spaces") || path.startsWith("/help")) {
    return "light";
  }
  switch (path) {
    case "/contact-us":
    case "/faq":
      return "white";
    case "/search":
    case "/explore":
    case "/favorites":
    case "/reset-password":
      return "light";
    default:
      return "transparent";
  }
};

export const HostHeader = () => {
  const { pathname } = useLocation();
  const [variant, setVariant] = useState(getNavBarVariant(pathname));
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);
const navigate = useNavigate();
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

  const saveAsDraft = () => {
    console.log("clicked");
    const saveDraftBtn = document.getElementById("save-as-draft");
    if (saveDraftBtn) {
      ReactTestUtils.Simulate.click(saveDraftBtn);
    }
  };

  if (pathname.includes("/login") || pathname.includes("/signup")) return null;

  return (
    <header
      className={`fixed top-0 left-0 z-50 flex w-screen flex-wrap items-center justify-between py-4 px-4 text-sm duration-500 md:flex-nowrap md:rounded-br-[32px] md:rounded-bl-[32px] md:px-12 header-${variant}`}
    >
      <nav className={`flex gap-6`}>
        <Link
          to="/"
          className=""
        >
          <LogoIcon fill={variant == "transparent" || variant == "light" ? undefined : "#101828"} />
        </Link>
      </nav>
      <StaticSearchBar className="hidden md:block" />

<div className="flex">
<nav className={`z-50 inline `}>
        {" "}
        {pathname.startsWith("/account") && (
          <button
            className={`self-stretch rounded-sm border px-6 py-[5px] pb-[7px] ${variant == "transparent" ? "" : "border-white"}`}
            onClick={()=>navigate("/search?location=&booking_start_time=&max_capacity=&capacity=&size=")}
          >
            <span>Explore Spaces</span>
          </button>
        )}
      </nav>

      <nav className="hidden items-center gap-6 md:flex">
        {["/spaces/add/4", "/spaces/add/5"].includes(pathname) || !pathname.startsWith("/spaces") ? (
          <>
            {" "}
            <Link
              to="/contact-us"
              className={`self-stretch rounded-md px-6 py-[5px] pb-[7px] font-normal my-border-${variant}`}
            >
              <span>Support</span>
            </Link>
            <NavMenu variant={variant} />
          </>
        ) : (
          <button
            className={`self-stretch rounded-sm border px-6 py-[5px] pb-[7px] ${variant == "transparent" ? "" : "border-white"}`}
            onClick={saveAsDraft}
          >
            <span>Save as draft</span>
          </button>
        )}
      </nav>

    </div>
      <nav className={`z-50 inline md:hidden`}>
        {" "}
        {pathname.startsWith("/spaces") && pathname != "/spaces/add/5" && pathname != "/spaces/add/4" ? (
          <button
            className={`self-stretch rounded-sm border px-6 py-[5px] pb-[7px] ${variant == "transparent" ? "" : "border-white"}`}
            onClick={saveAsDraft}
          >
            <span>Save as draft</span>
          </button>
        ) : (
          <NavMenu variant={variant} />
        )}
      </nav>
     
      <StaticSearchBar className="flex w-full justify-center py-4 md:hidden" />
    </header>
  );
};

export default HostHeader;
