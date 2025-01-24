import { isNotInViewport } from "@/utils/utils";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import LogoIcon from "./frontend/icons/LogoIcon";
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
    case "/reset-password":
    case "/check-verification":
      return "light";
    default:
      return "transparent";
  }
};

export const PublicHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [variant, setVariant] = useState(getNavBarVariant(pathname));
  const [showStaticBar, setShowStaticBar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (pathname == "/") {
        if (window.scrollY > 10) {
          setVariant("white");
        } else {
          setVariant("transparent");
        }
      }
      setShowStaticBar(isNotInViewport("search-bar"));
    };
    window.addEventListener("scroll", onScroll);
    setShowStaticBar(isNotInViewport("search-bar"));

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    setVariant(getNavBarVariant(pathname));
  }, [pathname]);

  if (pathname.includes("/login") || pathname.includes("/signup")) return null;

  return (
    <header
      className={`fixed top-0 left-0 z-50 flex w-screen flex-wrap items-center justify-between py-4 px-4 text-sm duration-500 md:rounded-br-[32px] md:rounded-bl-[32px] md:px-12 lg:flex-nowrap header-${variant}`}
    >
      <nav className={`lg:flex ${showStaticBar ? "hidden" : "flex"} gap-6`}>
        <Link to="/">
          <LogoIcon fill={variant == "transparent" || variant == "light" ? undefined : "#101828"} />
        </Link>
      </nav>
      <div className="hidden lg:block">{showStaticBar && (pathname == "/search" || pathname == "/") && <StaticSearchBar />}</div>

      <nav className="hidden items-center gap-6 lg:flex">
        <Link
          to="/login"
          className={`rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant} whitespace-nowrap`}
        >
          <span>Login</span>
        </Link>
        <Link
          to="/signup/select-role"
          className={`rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant} whitespace-nowrap`}
        >
          <span>Sign up</span>
        </Link>
      </nav>
      <nav className={`lg:hidden ${showStaticBar ? "hidden" : "flex"}  items-center gap-4`}>
        <Link
          to="/login"
          className={`rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant}`}
        >
          <span>Login</span>
        </Link>
        <Link
          to="/signup/select-role"
          className={`rounded-md border px-6 py-[5px] pb-[7px] my-border-${variant}`}
        >
          <span>Sign up</span>
        </Link>
      </nav>
      <div className={`${showStaticBar && (pathname == "/search" || pathname == "/") ? "py-4" : ""} flex w-full justify-center lg:hidden`}>
        {showStaticBar && (pathname == "/search" || pathname == "/") && <StaticSearchBar className="flex w-full justify-center py-4 md:hidden" />}
      </div>
    </header>
  );
};

export default PublicHeader;
